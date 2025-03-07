import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/app/infrastructure/db';
import { products } from '@/app/infrastructure/db/schema';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allProducts = await db
      .select()
      .from(products)
      .orderBy(products.amount);

    return NextResponse.json({ products: allProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description, stripePriceId, amount, productType, maxDreams } =
      await request.json();

    const [newProduct] = await db
      .insert(products)
      .values({
        id: `prod_${Math.random().toString(36).substring(2, 15)}`,
        name,
        description,
        stripePriceId,
        amount,
        productType,
        maxDreams,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 },
    );
  }
}
