import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id:true, name:true, email:true, image:true, plan:true, planExpiresAt:true, aiParsesUsed:true, createdAt:true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Check if pro plan expired
    const isPro = user.plan === 'pro' && (!user.planExpiresAt || user.planExpiresAt > new Date());
    const effectivePlan = isPro ? 'pro' : 'free';
    if (user.plan === 'pro' && !isPro) {
      await prisma.user.update({ where: { id: userId }, data: { plan: 'free' } });
    }

    const payments = await prisma.payment.findMany({
      where: { userId, status: 'paid' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id:true, amount:true, plan:true, createdAt:true, razorpayPaymentId:true },
    });

    return NextResponse.json({ user: { ...user, plan: effectivePlan }, payments });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  try {
    const body = await req.json();
    const { name } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: { id:true, name:true, email:true },
    });
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
