import { pgTable, serial, varchar, timestamp, text, boolean, decimal, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';

// Create ENUM for product types
export const productTypeEnum = pgEnum('product_type', ['subscription', 'one-time']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull().unique(), 
  firstName: varchar('first_name', { length: 256 }),
  lastName: varchar('last_name', { length: 256 }),
  email: varchar('email', { length: 256 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Dreams table
export const dreams = pgTable('dreams', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull().references(() => users.userId),
  productId: varchar('product_id', { length: 256 }).references(() => products.id),
  orderId: varchar('order_id', { length: 256 }).references(() => orders.id),
  dreamText: jsonb('dream_text').notNull().$type<{ content: string; metadata?: Record<string, any> }>(),
  interpretation: jsonb('interpretation').$type<{ content: string; metadata?: Record<string, any> }>(),
  // Privacy and payment tracking
  privacyGlassUnlocked: boolean('privacy_glass_unlocked').default(false).notNull(),
  unlockPaymentId: varchar('unlock_payment_id', { length: 256 }).references(() => orders.id),
  unlockedAt: timestamp('unlocked_at'), // When the dream was unlocked
  usedInSubscription: boolean('used_in_subscription').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Products table
export const products = pgTable('products', {
  id: varchar('id', { length: 256 }).primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description'),
  stripePriceId: varchar('stripe_price_id', { length: 256 }).notNull().unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  productType: productTypeEnum('product_type').notNull(),
  maxDreams: integer('max_dreams'), // 1 for single, 3 for bundle
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Orders table
export const orders = pgTable('orders', {
  id: varchar('id', { length: 256 }).primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull().references(() => users.userId),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 256 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Order Items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: varchar('order_id', { length: 256 }).notNull().references(() => orders.id),
  productId: varchar('product_id', { length: 256 }).notNull().references(() => products.id),
  stripePriceId: varchar('stripe_price_id', { length: 256 }).notNull(),
  quantity: integer('quantity').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  dreamId: integer('dream_id').references(() => dreams.id), // For dream unlocking purchases
});

// Type inference helpers
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Dream = typeof dreams.$inferSelect;
export type NewDream = typeof dreams.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

// Create indexes
export const usersIndexes = {
  emailIdx: 'create index users_email_idx on users (email)',
  userIdIdx: 'create unique index users_user_id_idx on users (user_id)',
};

export const dreamsIndexes = {
  userIdIdx: 'create index dreams_user_id_idx on dreams (user_id)',
  createdAtIdx: 'create index dreams_created_at_idx on dreams (created_at)',
  unlockPaymentIdIdx: 'create index dreams_unlock_payment_id_idx on dreams (unlock_payment_id)',
  privacyGlassIdx: 'create index dreams_privacy_glass_unlocked_idx on dreams (privacy_glass_unlocked)',
};

export const productsIndexes = {
  stripePriceIdIdx: 'create unique index products_stripe_price_id_idx on products (stripe_price_id)',
};

export const ordersIndexes = {
  userIdIdx: 'create index orders_user_id_idx on orders (user_id)',
  stripePaymentIntentIdIdx: 'create index orders_stripe_payment_intent_id_idx on orders (stripe_payment_intent_id)',
};

export const orderItemsIndexes = {
  orderIdIdx: 'create index order_items_order_id_idx on order_items (order_id)',
  productIdIdx: 'create index order_items_product_id_idx on order_items (product_id)',
  stripePriceIdIdx: 'create index order_items_stripe_price_id_idx on order_items (stripe_price_id)',
  dreamIdIdx: 'create index order_items_dream_id_idx on order_items (dream_id)',
};