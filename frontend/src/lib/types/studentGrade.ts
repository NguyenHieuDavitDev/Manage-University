export type StudentGradebookComponent = {
  id: number;
  componentCode: string;
  componentName: string;
  weightPercent: number | null;
};

export type StudentGradebookRow = {
  enrollmentId: number;
  userId: string;
  username: string;
  fullName: string;
  scores: Record<string, number | null>;
  weightedAverage: number | null;
  letterGrade: string | null;
};

export type StudentGradebook = {
  courseClassId: number;
  courseCode: string;
  courseName: string;
  sectionCode: string;
  className: string | null;
  academicYear: string;
  semester: number;
  gradebookFinalized: boolean;
  components: StudentGradebookComponent[];
  students: StudentGradebookRow[];
};

export type StudentGradeUpsertPayload = {
  scores: Array<{
    gradeComponentId: number;
    score: number | null;
  }>;
};
