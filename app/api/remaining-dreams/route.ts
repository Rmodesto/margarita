// File: app/api/remaining-dreams/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/app/infrastructure/db';
import { orders } from '@/app/infrastructure/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query active orders (for bundles or one-time products) with remainingDreams > 0
  const activeOrders = await db
    .select({
      id: orders.id,
      remainingDreams: orders.remainingDreams,
    })
    .from(orders)
    .where(and(eq(orders.userId, userId), sql`${orders.remainingDreams} > 0`));

  // Return active orders under the key "orders"
  return NextResponse.json({ orders: activeOrders });
}
