import { ParsedSlot } from '@/types';

interface Options {
  slots: ParsedSlot[];
  startDate: Date;
  endDate: Date;
  skipDays?: string[];
}

export interface GeneratedSession {
  date: Date;
  subject: string;
  startTime: string;
  endTime: string;
}

const DAY_MAP: Record<string, number> = {
  Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6,
};

export function generateSessions({ slots, startDate, endDate, skipDays = [] }: Options): GeneratedSession[] {
  const sessions: GeneratedSession[] = [];
  const skipSet = new Set(skipDays);
  const cur = new Date(startDate);
  cur.setHours(0,0,0,0);
  const end = new Date(endDate);
  end.setHours(23,59,59,999);

  while (cur <= end) {
    const dow = cur.getDay();
    const ds = cur.toISOString().split('T')[0];
    if (!skipSet.has(ds)) {
      for (const slot of slots.filter(s => DAY_MAP[s.day] === dow)) {
        sessions.push({
          date: new Date(cur),
          subject: slot.subject,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      }
    }
    cur.setDate(cur.getDate() + 1);
  }

  return sessions.sort((a,b) => {
    const dd = a.date.getTime() - b.date.getTime();
    return dd !== 0 ? dd : a.startTime.localeCompare(b.startTime);
  });
}
