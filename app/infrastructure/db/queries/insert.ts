import { InferInsertModel } from 'drizzle-orm';

import { users, orders, dreams } from '@/app/infrastructure/db/schema';

import { db } from '../index';

// Define types we're actually using
type NewUser = InferInsertModel<typeof users>;
type NewDream = InferInsertModel<typeof dreams>;

// Insert a new user
export async function createUser(data: NewUser) {
  return await db.insert(users).values(data);
}

// Insert a new order
export async function createOrder(data: {
  userId: string;
  stripePaymentId?: string;
  amount: number;
}) {
  return await db.insert(orders).values({
    userId: data.userId,
    stripePaymentId: data.stripePaymentId,
    amount: data.amount.toString(), // Convert number to string for decimal type
  });
}

// Insert a new dream
export async function createDream(data: NewDream) {
  return await db.insert(dreams).values(data);
}
