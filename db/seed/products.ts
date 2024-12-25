import { db } from "../index";
import { products, type NewProduct } from "../schema";

export async function seedProducts() {
  const productsData: NewProduct[] = [
    {
      id: "1",
      name: "Single Dream Interpretation",
      description: "Unlock a detailed interpretation for one dream",
      stripePriceId: process.env.STRIPE_PRICE_ID_SINGLE ?? "",
      amount: "5.00", // $5.00
      productType: "one-time",
      maxDreams: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      name: "Dream Bundle",
      description: "Get 30 dream interpretations at a discounted price",
      stripePriceId: process.env.STRIPE_PRICE_ID_BUNDLE ?? "",
      amount: "15.00", // $15.00
      productType: "one-time",
      maxDreams: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const product of productsData) {
    await db
      .insert(products)
      .values(product)
      .onConflictDoUpdate({
        target: products.id,
        set: {
          name: product.name,
          description: product.description,
          stripePriceId: product.stripePriceId,
          amount: product.amount,
          maxDreams: product.maxDreams,
          updatedAt: new Date(),
        },
      });
  }
}
