import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/app/infrastructure/db';
import { dreams } from '@/app/infrastructure/db/schema';
import { Message } from 'ai';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      userMessage,
      aiMessage,
    }: {
      userMessage: string;
      aiMessage: Message;
    } = await request.json();

    await db.insert(dreams).values({
      id: aiMessage.id, // OpenAI message ID
      userId: userId, // From Clerk auth
      dreamText: userMessage, // User's dream input
      interpretation: aiMessage.content, // AI's interpretation
      privacyGlassUnlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      dreamId: aiMessage.id,
    });
  } catch (error) {
    console.error('Error creating dream:', error);
    return NextResponse.json(
      { error: 'Failed to create dream' },
      { status: 500 },
    );
  }
}
