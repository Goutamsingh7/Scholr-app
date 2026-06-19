import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const PLAN_MONTHS = { semester: 5, yearly: 12 } as const;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // Verify signature
    const body    = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

    // Find pending payment
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
    if (!payment || payment.userId !== userId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    const months = PLAN_MONTHS[payment.plan as keyof typeof PLAN_MONTHS] ?? 5;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Update payment + user plan in transaction
    await prisma.$transaction([
      prisma.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, status: 'paid' },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { plan: 'pro', planExpiresAt: expiresAt },
      }),
    ]);

    return NextResponse.json({ success: true, plan: 'pro', expiresAt });
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
