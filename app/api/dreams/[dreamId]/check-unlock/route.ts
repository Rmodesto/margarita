import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dreams } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { dreamId: string } },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dreamId = params.dreamId;
    if (!dreamId) {
      return NextResponse.json(
        { error: 'Dream ID is required' },
        { status: 400 },
      );
    }

    // Query the dream record using the OpenAI message id.
    const result = await db
      .select({
        privacyGlassUnlocked: dreams.privacyGlassUnlocked,
        unlockPaymentId: dreams.unlockPaymentId,
        unlockedAt: dreams.unlockedAt,
      })
      .from(dreams)
      .where(eq(dreams.id, dreamId))
      .limit(1);

    if (!result.length) {
      return NextResponse.json(
        { error: 'Dream not found', code: 'DREAM_NOT_FOUND' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      isUnlocked: result[0].privacyGlassUnlocked,
      unlockedAt: result[0].unlockedAt,
      unlockPaymentId: result[0].unlockPaymentId,
    });
  } catch (error) {
    console.error('Error checking unlock status:', error);
    return NextResponse.json(
      { error: 'Failed to check unlock status' },
      { status: 500 },
    );
  }
}
