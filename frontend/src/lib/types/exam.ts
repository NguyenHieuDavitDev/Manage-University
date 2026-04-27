import type { SpringPage } from "@/lib/types/common";

export type Exam = {
  id: number;
  courseClassId: number;
  courseCode: string;
  courseName: string;
  sectionCode: string;
  examTypeId: number;
  examTypeCode: string;
  examTypeName: string;
  classroomId: number;
  roomCode: string;
  roomName: string;
  examDate: string;
  startPeriod: number;
  endPeriod: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExamPayload = {
  courseClassId: number;
  examTypeId: number;
  classroomId: number;
  examDate: string;
  startPeriod: number;
  endPeriod: number;
  description?: string | null;
};

export type ExamAutoSchedulePayload = {
  examTypeId: number;
  fromDate: string;
  toDate: string;
  classroomIds?: number[];
};

export type ExamPage = SpringPage<Exam>;
