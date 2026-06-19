import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSessions } from '@/lib/schedule-generator';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { slots, startDate, endDate, skipDays, criteria } = await req.json();
    const userId = (session.user as any).id;
    await prisma.timetable.deleteMany({ where: { userId } });
    const sessions = generateSessions({
      slots, startDate: new Date(startDate), endDate: new Date(endDate), skipDays: skipDays ?? [],
    });
    const timetable = await prisma.timetable.create({
      data: {
        userId, rawJson: slots,
        startDate: new Date(startDate), endDate: new Date(endDate),
        skipDays: skipDays ?? [],
        attendanceCriteria: criteria ?? {},
        sessions: { create: sessions.map(s => ({ date:s.date, subject:s.subject, startTime:s.startTime, endTime:s.endTime })) },
      },
      include: { sessions: { select: { id:true } } },
    });
    return NextResponse.json({ timetable, sessionsCreated: sessions.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to save timetable' }, { status: 500 });
  }
}
