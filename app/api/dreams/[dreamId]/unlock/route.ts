// api/dreams/[dreamId]/unlock/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dreams, orders } from '@/db/schema';
import { and, eq, gt } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: { dreamId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dreamId = params.dreamId;
    if (!dreamId) {
      return NextResponse.json(
        { error: 'Dream ID is required' },
        { status: 400 }
      );
    }

    // First, check if the dream is already unlocked
    const [dreamRecord] = await db
      .select({
        id: dreams.id,
        privacyGlassUnlocked: dreams.privacyGlassUnlocked,
        orderId: dreams.orderId,
        unlockPaymentId: dreams.unlockPaymentId
      })
      .from(dreams)
      .where(eq(dreams.id, dreamId))
      .limit(1);

    if (!dreamRecord) {
      return NextResponse.json(
        { error: 'Dream not found', code: 'DREAM_NOT_FOUND' },
        { status: 404 }
      );
    }

    // If dream is already unlocked, just return success
    if (dreamRecord.privacyGlassUnlocked) {
      return NextResponse.json({ 
        success: true,
        alreadyUnlocked: true 
      });
    }

    // Check if this dream is already linked to an order
    if (dreamRecord.orderId) {
      // Just need to set it as unlocked
      await db
        .update(dreams)
        .set({ 
          privacyGlassUnlocked: true,
          unlockedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(dreams.id, dreamId));
        
      return NextResponse.json({ success: true });
    }

    // Find an active order for the user with remainingDreams > 0
    const [activeOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, userId), gt(orders.remainingDreams, 0)))
      .orderBy(orders.createdAt)
      .limit(1);

    if (!activeOrder) {
      console.log(`No active order found for user: ${userId}`);
      // Try one more time after a small delay (webhook might still be processing)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const [retryOrder] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.userId, userId), gt(orders.remainingDreams, 0)))
        .orderBy(orders.createdAt)
        .limit(1);
        
      if (!retryOrder) {
        return NextResponse.json(
          { error: 'No active order found', code: 'NO_ACTIVE_ORDER' },
          { status: 400 }
        );
      }
      
      // Use the order found in retry
      const now = new Date();
      await db.transaction(async tx => {
        await tx
          .update(dreams)
          .set({
            privacyGlassUnlocked: true,
            orderId: retryOrder.id,
            unlockPaymentId: retryOrder.stripePaymentIntentId,
            unlockedAt: now,
            updatedAt: now
          })
          .where(eq(dreams.id, dreamId));

        await tx
          .update(orders)
          .set({ 
            remainingDreams: (retryOrder.remainingDreams ?? 0) - 1,
            updatedAt: now
          })
          .where(eq(orders.id, retryOrder.id));
      });
      
      return NextResponse.json({ success: true });
    }

    // Normal flow - use the active order found
    const now = new Date();
    await db.transaction(async tx => {
      await tx
        .update(dreams)
        .set({
          privacyGlassUnlocked: true,
          orderId: activeOrder.id,
          unlockPaymentId: activeOrder.stripePaymentIntentId,
          unlockedAt: now,
          updatedAt: now
        })
        .where(eq(dreams.id, dreamId));

      await tx
        .update(orders)
        .set({ 
          remainingDreams: (activeOrder.remainingDreams ?? 0) - 1,
          updatedAt: now
        })
        .where(eq(orders.id, activeOrder.id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in unlock endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to unlock dream', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}