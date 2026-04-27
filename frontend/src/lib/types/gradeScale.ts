export type GradeScale = {
  id: number;
  letterGrade: string;
  minScore: number;
  maxScore: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GradeScalePayload = {
  letterGrade: string;
  minScore: number;
  maxScore: number;
  description?: string | null;
};
