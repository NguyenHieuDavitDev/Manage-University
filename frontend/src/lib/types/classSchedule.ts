export interface ClassSchedule {
  id: number;
  courseClassId: number;
  courseCode: string;
  courseName: string;
  sectionCode: string;
  className: string | null;
  classroomId: number;
  roomCode: string;
  roomName: string;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  startDate: string;
  endDate: string;
  lecturerUserId: string;
  lecturerUsername: string;
  lecturerFullName: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ClassSchedulePayload = {
  courseClassId: number;
  classroomId: number;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  startDate: string;
  endDate: string;
  lecturerUserId: string;
  description?: string | null;
};

export type ClassScheduleMovePayload = {
  dayOfWeek: number;
  shiftCode: "M1" | "M2" | "A1" | "A2" | "E1";
  targetDate: string;
};
