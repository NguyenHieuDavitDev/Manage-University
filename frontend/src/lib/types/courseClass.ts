export interface CourseClass {
  id: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  sectionCode: string;
  className: string | null;
  academicYear: string;
  semester: number;
  capacity: number | null;
  enrolledCount?: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CourseClassPayload = {
  courseId: number;
  sectionCode: string;
  className?: string | null;
  academicYear: string;
  semester: number;
  capacity?: number | null;
  description?: string | null;
};
