export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  try {
    const timetable = await prisma.timetable.findFirst({ where: { userId } });
    if (!timetable) return NextResponse.json({ error: 'No timetable' }, { status: 404 });

    const criteria = (timetable.attendanceCriteria as Record<string,number>) ?? {};
    const sessions = await prisma.classSession.findMany({
      where: { timetableId: timetable.id },
      include: { attendance: true },
      orderBy: [{ date:'asc' }, { startTime:'asc' }],
    });

    const user = await prisma.user.findUnique({
      where: { id: userId }, select: { name:true, email:true },
    });

    // Build subject stats
    const subjectMap = new Map<string, { present:number; absent:number; holiday:number; total:number }>();
    sessions.forEach(s => {
      if (!subjectMap.has(s.subject)) subjectMap.set(s.subject, { present:0,absent:0,holiday:0,total:0 });
      const st = subjectMap.get(s.subject)!;
      st.total++;
      if (s.attendance?.status === 'present') st.present++;
      else if (s.attendance?.status === 'absent') st.absent++;
      else if (s.attendance?.status === 'holiday') st.holiday++;
    });

    const subjectStats = Array.from(subjectMap.entries()).map(([subject, st]) => {
      const threshold = criteria[subject] ?? 75;
      const eff = st.total - st.holiday;
      const pct = eff > 0 ? Math.round((st.present / eff) * 100) : 0;
      return { subject, ...st, effective:eff, percentage:pct, threshold };
    });

    const total    = sessions.length;
    const present  = sessions.filter(s => s.attendance?.status==='present').length;
    const absent   = sessions.filter(s => s.attendance?.status==='absent').length;
    const holidays = sessions.filter(s => s.attendance?.status==='holiday').length;
    const effective = total - holidays;
    const percentage = effective > 0 ? Math.round((present/effective)*100) : 0;

    return NextResponse.json({
      user,
      exportedAt: new Date().toISOString(),
      semester: { startDate: timetable.startDate, endDate: timetable.endDate },
      overall:  { total, present, absent, holidays, effective, percentage },
      subjectStats,
      recentSessions: sessions.slice(-50).map(s => ({
        date: s.date, subject: s.subject, startTime: s.startTime, endTime: s.endTime,
        status: s.attendance?.status ?? 'unmarked',
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
