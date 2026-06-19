export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PLANS = {
  semester: { amount: 14900, label: 'Pro Semester', months: 5 },
  yearly:   { amount: 24900, label: 'Pro Annual',   months: 12 },
} as const;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  try {
    const { plan } = await req.json();
    if (!plan || !PLANS[plan as keyof typeof PLANS])
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const planConfig = PLANS[plan as keyof typeof PLANS];

    // Dynamically import Razorpay to avoid SSR issues
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Razorpay caps receipt at 40 chars — use short timestamp + userId tail
    const shortReceipt = `sch_${userId.slice(-12)}_${Date.now().toString(36)}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount:   planConfig.amount,
      currency: 'INR',
      receipt:  shortReceipt,
      notes:    { userId, plan },
    });

    // Save pending payment record
    await prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: order.id,
        amount:   planConfig.amount,
        currency: 'INR',
        plan,
        status:   'pending',
      },
    });

    return NextResponse.json({ orderId: order.id, amount: planConfig.amount, currency: 'INR' });
  } catch (err: any) {
    console.error('Create order error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
