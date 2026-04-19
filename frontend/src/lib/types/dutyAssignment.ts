import type { ApiErrorBody } from "@/lib/types/common";

export type { ApiErrorBody };

export interface DutyAssignment {
  id: number;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  facultyId: number | null;
  facultyCode: string | null;
  facultyName: string | null;
  departmentId: number | null;
  departmentCode: string | null;
  departmentName: string | null;
  positionId: number | null;
  positionCode: string | null;
  positionName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DutyAssignmentOrgPayload = {
  facultyId?: number | null;
  departmentId?: number | null;
  positionId?: number | null;
};

export type DutyAssignmentCreatePayload = DutyAssignmentOrgPayload & {
  userId: string;
};
