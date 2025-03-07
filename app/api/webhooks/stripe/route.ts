import { NextResponse } from 'next/server';
import { db } from '@/app/infrastructure/db';
import { orders, dreams } from '@/app/infrastructure/db/schema';
import { PRICING_TIERS } from '@/constants/pricing';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, dreamId } = session.metadata!;
      const now = new Date();
      
      // Find the pricing tier that matches the purchase
      const pricingTier = PRICING_TIERS.find(
        tier => tier.priceId === session.line_items?.data[0]?.price?.id
      );

      if (!pricingTier) {
        throw new Error('Invalid pricing tier');
      }

      // Convert amount to string and handle cents to dollars conversion
      const amountInDollars = ((session.amount_total ?? 0) / 100).toString();
      
      // Use a transaction to ensure both operations succeed or fail together
      await db.transaction(async (tx) => {
        // 1. Create the order
        const [newOrder] = await tx
          .insert(orders)
          .values({
            id: crypto.randomUUID(),
            userId,
            amount: amountInDollars,
            remainingDreams: pricingTier.credits,
            stripePaymentIntentId: session.payment_intent as string,
            createdAt: now,
            updatedAt: now
          })
          .returning();

        // 2. If there's a specific dream to unlock, update it immediately
        if (dreamId) {
          await tx
            .update(dreams)
            .set({
              privacyGlassUnlocked: true,
              unlockPaymentId: session.payment_intent as string,
              orderId: newOrder.id,
              unlockedAt: now,
              updatedAt: now,
              // Set bundleId if this is a multi-dream purchase
              bundleId: pricingTier.credits > 1 ? newOrder.id : null
            })
            .where(eq(dreams.id, dreamId));
        }
      });

      // Log success for monitoring
      console.log(`Successfully processed payment for user ${userId}${dreamId ? ` and unlocked dream ${dreamId}` : ''}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' }, 
      { status: 400 }
    );
  }
}