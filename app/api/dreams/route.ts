// api/dreams/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dreams, orders } from '@/db/schema';

import { and, eq, gt } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      dreamText,
      messageId, // OpenAI message ID
      interpretation, // AI's interpretation
      threadId, // OpenAI thread ID
    } = await request.json();

    // Check for active order with remaining dreams
    const [activeOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, userId), gt(orders.remainingDreams, 0)))
      .orderBy(orders.createdAt)
      .limit(1);

    // Create dream record
    const [newDream] = await db
      .insert(dreams)
      .values({
        id: messageId, // Using OpenAI message ID
        userId,
        dreamText: {
          content: dreamText,
          timestamp: new Date().toISOString(),
        },
        interpretation: {
          content: interpretation,
          timestamp: new Date().toISOString(),
        },
        privacyGlassUnlocked: false, // Always starts as locked
        orderId: activeOrder?.id || null, // Link to active order if exists
        threadId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      dreamId: messageId,
      dream: newDream,
      hasActiveOrder: !!activeOrder,
      remainingDreams: activeOrder?.remainingDreams || 0,
    });
  } catch (error) {
    console.error('Error creating dream:', error);
    return NextResponse.json(
      { error: 'Failed to create dream' },
      { status: 500 },
    );
  }
}

// GET endpoint to check active orders/remaining dreams
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find active order with remaining dreams
  const [activeOrder] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), gt(orders.remainingDreams, 0)))
    .orderBy(orders.createdAt)
    .limit(1);

  return NextResponse.json({
    order: activeOrder || null,
    hasActiveOrder: !!activeOrder,
    remainingDreams: activeOrder?.remainingDreams || 0,
  });
}
