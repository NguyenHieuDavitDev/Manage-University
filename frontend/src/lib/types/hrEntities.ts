import type { ApiErrorBody, SpringPage } from "@/lib/types/common";

export type { ApiErrorBody, SpringPage };

export interface AcademicRank {
  id: number;
  rankCode: string;
  rankName: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AcademicRankPayload = {
  rankCode: string;
  rankName: string;
  description?: string | null;
};

export interface Faculty {
  id: number;
  facultyCode: string;
  facultyName: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FacultyPayload = {
  facultyCode: string;
  facultyName: string;
  description?: string | null;
};

export interface Department {
  id: number;
  departmentCode: string;
  departmentName: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DepartmentPayload = {
  departmentCode: string;
  departmentName: string;
  description?: string | null;
};

export interface Course {
  id: number;
  courseCode: string;
  courseName: string;
  credits: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CoursePayload = {
  courseCode: string;
  courseName: string;
  credits: number;
  description?: string | null;
};

export interface Position {
  id: number;
  positionCode: string;
  positionName: string;
  positionCategory: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PositionPayload = {
  positionCode: string;
  positionName: string;
  positionCategory?: string | null;
  description?: string | null;
};

export interface Credential {
  id: number;
  userId: string;
  userFullName: string | null;
  credentialName: string;
  credentialCategory: string;
  issuingOrganization: string | null;
  credentialNumber: string | null;
  issueDate: string;
  expiryDate: string | null;
  notes: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CredentialPayload = {
  userId: string;
  credentialName: string;
  credentialCategory: string;
  issuingOrganization?: string | null;
  credentialNumber?: string | null;
  issueDate: string;
  expiryDate?: string | null;
  notes?: string | null;
  attachmentUrl?: string | null;
};

export interface Insurance {
  id: number;
  userId: string;
  userFullName: string | null;
  insuranceType: string;
  policyNumber: string | null;
  provider: string | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InsurancePayload = {
  userId: string;
  insuranceType: string;
  policyNumber?: string | null;
  provider?: string | null;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  attachmentUrl?: string | null;
};

export interface LaborContract {
  id: number;
  userId: string;
  userFullName: string | null;
  contractNumber: string;
  contractType: string | null;
  startDate: string;
  endDate: string | null;
  status: string | null;
  notes: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LaborContractPayload = {
  userId: string;
  contractNumber: string;
  contractType?: string | null;
  startDate: string;
  endDate?: string | null;
  status?: string | null;
  notes?: string | null;
  attachmentUrl?: string | null;
};

export interface ResearchWork {
  id: number;
  userId: string;
  userFullName: string | null;
  title: string;
  workType: string | null;
  publicationYear: number | null;
  venue: string | null;
  authorRole: string | null;
  notes: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ResearchWorkPayload = {
  userId: string;
  title: string;
  workType?: string | null;
  publicationYear?: number | null;
  venue?: string | null;
  authorRole?: string | null;
  notes?: string | null;
  attachmentUrl?: string | null;
};
