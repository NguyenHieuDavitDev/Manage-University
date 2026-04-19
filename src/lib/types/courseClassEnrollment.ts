import type { SpringPage } from "@/lib/types/common";

export type CourseClassMember = {
  userId: string;
  username: string;
  fullName: string;
  enrolledAt: string;
};

export type MyCourseClassEnrollment = {
  enrollmentId: number;
  courseClassId: number;
  courseId?: number;
  courseCode: string;
  courseName: string;
  sectionCode: string;
  className: string | null;
  academicYear: string;
  semester: number;
  enrolledAt: string;
};

export type MyCourseClassEnrollmentPage = SpringPage<MyCourseClassEnrollment>;
