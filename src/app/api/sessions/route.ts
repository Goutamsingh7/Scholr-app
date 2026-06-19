export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get('weekStart');
  const weekEnd   = searchParams.get('weekEnd');
  const all       = searchParams.get('all') === 'true';

  try {
    const timetable = await prisma.timetable.findFirst({ where: { userId } });
    if (!timetable) return NextResponse.json({ sessions:[], hasTimetable:false });

    const where: any = { timetableId: timetable.id };

    if (!all && weekStart && weekEnd) {
      where.date = { gte: new Date(weekStart), lte: new Date(weekEnd) };
    } else if (!all) {
      // Default: next 14 days from today
      const today = new Date(); today.setHours(0,0,0,0);
      const next14 = new Date(today); next14.setDate(today.getDate() + 14);
      where.date = { gte: today, lte: next14 };
    }

    const sessions = await prisma.classSession.findMany({
      where,
      include: { attendance:true, notes:{ select:{ id:true, content:true, imageData:false, createdAt:true } }, mediaUploads:true },
      orderBy: [{ date:'asc' }, { startTime:'asc' }],
      ...(all ? {} : { take: 200 }),
    });

    return NextResponse.json({ sessions, hasTimetable:true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error:'Server error' }, { status:500 });
  }
}
