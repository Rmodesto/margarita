import { seedProducts } from "./products";

async function main() {
  try {
    await seedProducts();
    console.log("All seeds completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error running seeds:", error);
    process.exit(1);
  }
}

main();
