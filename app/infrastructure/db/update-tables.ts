import { db } from "@/app/infrastructure/db";
import { sql } from "drizzle-orm";

async function updateDreamsTable() {
  try {
    console.log("Starting dreams table update...");

    await db.transaction(async (tx) => {
      // Add threadId column to dreams table
      console.log("Adding threadId column to dreams table...");
      await tx.execute(sql`
        ALTER TABLE "dreams"
        ADD COLUMN IF NOT EXISTS "thread_id" varchar(256);
      `);

      // Create index on threadId for better query performance
      console.log("Creating index on threadId...");
      await tx.execute(sql`
        CREATE INDEX IF NOT EXISTS "dreams_thread_id_idx" ON "dreams" ("thread_id");
      `);
    });

    console.log("✅ Dreams table update completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Dreams table update failed:", error);
    process.exit(1);
  }
}

updateDreamsTable();
