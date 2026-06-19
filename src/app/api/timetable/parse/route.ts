export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseTimetableImage } from '@/lib/ai-parser';
import { prisma } from '@/lib/prisma';

const FREE_PARSE_LIMIT = 2;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  try {
    // Check user plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true, aiParsesUsed: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isPro = user.plan === 'pro' && (!user.planExpiresAt || user.planExpiresAt > new Date());

    if (!isPro && user.aiParsesUsed >= FREE_PARSE_LIMIT) {
      return NextResponse.json({
        error: 'free_limit_reached',
        aiParsesUsed: user.aiParsesUsed,
        limit: FREE_PARSE_LIMIT,
      }, { status: 402 });
    }

    const { imageData, mimeType } = await req.json();
    if (!imageData) return NextResponse.json({ error: 'Image required' }, { status: 400 });

    const result = await parseTimetableImage(imageData, mimeType ?? 'image/jpeg');

    // Increment parse counter for free users
    if (!isPro) {
      await prisma.user.update({ where: { id: userId }, data: { aiParsesUsed: { increment: 1 } } });
    }

    return NextResponse.json({ ...result, aiParsesUsed: user.aiParsesUsed + 1, isPro });
  } catch (err: any) {
    console.error('Parse error:', err);
    return NextResponse.json({ error: 'AI parser failed. Try Manual Entry or upgrade to Pro.' }, { status: 500 });
  }
}
