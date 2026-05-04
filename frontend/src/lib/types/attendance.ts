export type AttendanceStatusCode = "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";

export interface TeachingCourseClass {
  id: number;
  courseCode: string;
  courseName: string;
  sectionCode: string;
  className: string | null;
  academicYear: string;
  semester: number;
}

/** Buổi học cụ thể theo TKB (tiết + ngày diễn ra). */
export interface AttendanceSlot {
  classScheduleId: number;
  sessionDate: string;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  roomCode: string | null;
  roomName: string | null;
  lecturerUserId: string;
  lecturerFullName: string | null;
  label: string;
}

export interface AttendanceSessionStudentRow {
  enrollmentId: number;
  userId: string;
  username: string;
  fullName: string | null;
  status: AttendanceStatusCode | null;
}

export interface AttendanceSession {
  courseClassId: number;
  classScheduleId: number;
  courseCode: string;
  courseName: string;
  sectionCode: string;
  sessionDate: string;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  roomCode: string | null;
  roomName: string | null;
  lecturerFullName: string | null;
  slotLabel: string;
  students: AttendanceSessionStudentRow[];
}

export interface AttendanceSessionUpsertPayload {
  items: { enrollmentId: number; status: AttendanceStatusCode }[];
}

export interface MyAttendanceDay {
  classScheduleId: number;
  sessionDate: string;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  roomCode: string | null;
  roomName: string | null;
  lecturerFullName: string | null;
  slotLabel: string;
  status: AttendanceStatusCode;
}
