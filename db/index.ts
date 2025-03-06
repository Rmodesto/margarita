// db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const connectionString = process.env.DATABASE_URL;

// For query purposes
const queryClient = postgres(connectionString, {
  ssl: {
    rejectUnauthorized: false, // This is needed for Supabase
  },
  prepare: false,
});

export const db = drizzle(queryClient);

// For checking connection
export async function checkDatabaseConnection() {
  try {
    console.log('Attempting to connect to database...');
    const result = await queryClient`SELECT 1`;
    console.log('Database connection successful');
    return result.length > 0;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
