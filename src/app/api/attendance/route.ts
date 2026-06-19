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
    if (!timetable) return NextResponse.json({ stats: null, subjectStats: [], criteria: {} });

    const criteria = (timetable.attendanceCriteria as Record<string,number>) ?? {};
    const getThreshold = (subject: string) => criteria[subject] ?? 75;

    const sessions = await prisma.classSession.findMany({
      where: { timetableId: timetable.id }, include: { attendance: true },
    });

    const total    = sessions.length;
    const present  = sessions.filter(s => s.attendance?.status === 'present').length;
    const absent   = sessions.filter(s => s.attendance?.status === 'absent').length;
    const holidays = sessions.filter(s => s.attendance?.status === 'holiday').length;
    const marked   = sessions.filter(s => s.attendance).length;
    const effective = total - holidays;
    const percentage = effective > 0 ? Math.round((present / effective) * 100) : 0;

    // ── FIXED: correct formula (effective is pre-counted whole semester) ──
    const T = 75 / 100;
    const globalNeedAttend = Math.max(0, Math.ceil(T * effective - present));
    const globalRemaining  = Math.max(0, effective - present - absent);
    const globalCanMiss    = Math.max(0, Math.min(globalRemaining, Math.floor(present + globalRemaining - T * effective)));
    const globalAchievable = globalNeedAttend <= globalRemaining;

    // ── Subject stats ─────────────────────────────────────────────────────
    const map = new Map<string, { present:number; absent:number; holiday:number; total:number }>();
    for (const s of sessions) {
      if (!map.has(s.subject)) map.set(s.subject, { present:0, absent:0, holiday:0, total:0 });
      const st = map.get(s.subject)!;
      st.total++;
      if (s.attendance?.status === 'present')      st.present++;
      else if (s.attendance?.status === 'absent')  st.absent++;
      else if (s.attendance?.status === 'holiday') st.holiday++;
    }

    const subjectStats = Array.from(map.entries()).map(([subject, st]) => {
      const threshold  = getThreshold(subject);
      const t          = threshold / 100;
      const eff        = st.total - st.holiday;
      const pct        = eff > 0 ? Math.round((st.present / eff) * 100) : 0;
      const needAttend = Math.max(0, Math.ceil(t * eff - st.present));
      const remaining  = Math.max(0, eff - st.present - st.absent);
      const canMiss    = Math.max(0, Math.min(remaining, Math.floor(st.present + remaining - t * eff)));
      const isAchievable = needAttend <= remaining;
      return { subject, ...st, percentage:pct, threshold, needAttend, canMiss, isAchievable };
    });

    return NextResponse.json({
      stats: { total, marked, present, absent, holidays, effective, percentage,
               needAttend:globalNeedAttend, canMiss:globalCanMiss, isAchievable:globalAchievable },
      subjectStats,
      criteria,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { classSessionId, status } = await req.json();
    if (!['present','absent','holiday'].includes(status))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    const attendance = await prisma.attendance.upsert({
      where: { classSessionId },
      update: { status, markedAt: new Date() },
      create: { classSessionId, status },
    });
    return NextResponse.json({ attendance });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
