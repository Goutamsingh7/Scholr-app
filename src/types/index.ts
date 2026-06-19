export interface ClassSession {
  id: string;
  timetableId: string;
  date: string;
  subject: string;
  startTime: string;
  endTime: string;
  attendance: Attendance | null;
  notes: Note[];
  mediaUploads: MediaUpload[];
}

export interface Attendance {
  id: string;
  classSessionId: string;
  status: 'present' | 'absent' | 'holiday';
  markedAt: string;
}

export interface Note {
  id: string;
  classSessionId: string;
  content: string;
  imageData?: string | null;
  createdAt: string;
}

export interface MediaUpload {
  id: string;
  classSessionId: string;
  type: 'image' | 'pdf';
  url: string;
  filename: string;
}

export interface AttendanceStats {
  total: number;
  marked: number;
  present: number;
  absent: number;
  holidays: number;
  effective: number;
  percentage: number;
  needAttend: number;
  canMiss: number;
  isAchievable: boolean;
}

export interface SubjectStats {
  subject: string;
  total: number;
  present: number;
  absent: number;
  holiday: number;
  percentage: number;
  threshold: number;
  needAttend: number;
  canMiss: number;
  isAchievable: boolean;
}

export interface ParsedSlot {
  day: string;
  subject: string;
  startTime: string;
  endTime: string;
}

export interface ParseResult {
  slots: ParsedSlot[];
  confidence: number;
  warnings: string[];
}
