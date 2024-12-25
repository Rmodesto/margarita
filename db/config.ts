// db/config.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// For query operations
const queryClient = postgres(connectionString, {
  ssl: "require",
  max: 1,
});

export const db = drizzle(queryClient);
