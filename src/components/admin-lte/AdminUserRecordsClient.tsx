"use client";

import { FaIcon } from "@/components/FaIcon";
import {
  createCredential,
  deleteCredential,
  fetchCredentialCategories,
  fetchCredentialPage,
  updateCredential,
} from "@/lib/api/credentials";
import {
  createInsurance,
  deleteInsurance,
  fetchInsurancePage,
  fetchInsuranceTypes,
  updateInsurance,
} from "@/lib/api/insurances";
import {
  createLaborContract,
  deleteLaborContract,
  fetchLaborContractPage,
  fetchLaborContractTypes,
  updateLaborContract,
} from "@/lib/api/laborContracts";
import {
  createResearchWork,
  deleteResearchWork,
  fetchResearchWorkPage,
  fetchResearchWorkTypes,
  updateResearchWork,
} from "@/lib/api/researchWorks";
import {
  backendPublicFileUrl,
  uploadCredentialDocument,
  uploadInsuranceDocument,
  uploadLaborContractDocument,
  uploadResearchWorkDocument,
} from "@/lib/api/uploads";
import { fetchUserPage } from "@/lib/api/users";
import type { ApiErrorBody } from "@/lib/types/common";
import type {
  Credential,
  CredentialPayload,
  Insurance,
  InsurancePayload,
  LaborContract,
  LaborContractPayload,
  ResearchWork,
  ResearchWorkPayload,
  SpringPage,
} from "@/lib/types/hrEntities";
import type { User } from "@/lib/types/user";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

export type UserRecordKind = "credential" | "insurance" | "laborContract" | "researchWork";

/** Mã loại gợi ý (khớp gợi ý backend entity). */
const DEFAULT_CREDENTIAL_CATEGORIES = ["CHUNG_CHI", "BANG_CAP"] as const;

const CREDENTIAL_CATEGORY_LABELS: Record<string, string> = {
  CHUNG_CHI: "Chứng chỉ",
  BANG_CAP: "Bằng cấp",
};

function credentialCategoryLabel(code: string): string {
  return CREDENTIAL_CATEGORY_LABELS[code] ?? code;
}

function mergeCredentialCategoryOptions(fromApi: string[]): string[] {
  const set = new Set<string>();
  for (const d of DEFAULT_CREDENTIAL_CATEGORIES) set.add(d);
  for (const c of fromApi) {
    const t = c?.trim();
    if (t) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
}

const DEFAULT_INSURANCE_TYPES = ["BHXH", "BHYT", "BHTN", "BHTNLD", "TNDS"] as const;

const INSURANCE_TYPE_LABELS: Record<string, string> = {
  BHXH: "Bảo hiểm xã hội",
  BHYT: "Bảo hiểm y tế",
  BHTN: "Bảo hiểm thất nghiệp",
  BHTNLD: "BHTN theo HĐLĐ",
  TNDS: "Bảo hiểm TNDS",
};

function insuranceTypeLabel(code: string): string {
  return INSURANCE_TYPE_LABELS[code] ?? code;
}

function mergeInsuranceTypeOptions(fromApi: string[]): string[] {
  const set = new Set<string>();
  for (const d of DEFAULT_INSURANCE_TYPES) set.add(d);
  for (const c of fromApi) {
    const t = c?.trim();
    if (t) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
}

const DEFAULT_LABOR_CONTRACT_TYPES = ["HD_THU_VIEC", "HD_XAC_DINH", "HD_KO_XAC_DINH", "HD_PART_TIME"] as const;

const LABOR_CONTRACT_TYPE_LABELS: Record<string, string> = {
  HD_THU_VIEC: "Hợp đồng thử việc",
  HD_XAC_DINH: "Hợp đồng xác định thời hạn",
  HD_KO_XAC_DINH: "Hợp đồng không xác định thời hạn",
  HD_PART_TIME: "Hợp đồng làm thêm / bán thời gian",
};

function laborContractTypeLabel(code: string): string {
  return LABOR_CONTRACT_TYPE_LABELS[code] ?? code;
}

function mergeLaborContractTypeOptions(fromApi: string[]): string[] {
  const set = new Set<string>();
  for (const d of DEFAULT_LABOR_CONTRACT_TYPES) set.add(d);
  for (const c of fromApi) {
    const t = c?.trim();
    if (t) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
}

const DEFAULT_RESEARCH_WORK_TYPES = ["BAI_BAO", "SACH_CHUONG", "HUI_NGHI", "DE_TAI_NCKH", "SANG_CHE"] as const;

const RESEARCH_WORK_TYPE_LABELS: Record<string, string> = {
  BAI_BAO: "Bài báo / tạp chí",
  SACH_CHUONG: "Sách / chương sách",
  HUI_NGHI: "Hội nghị / hội thảo",
  DE_TAI_NCKH: "Đề tài NCKH",
  SANG_CHE: "Sáng chế / giải pháp hữu ích",
};

function researchWorkTypeLabel(code: string): string {
  return RESEARCH_WORK_TYPE_LABELS[code] ?? code;
}

function mergeResearchWorkTypeOptions(fromApi: string[]): string[] {
  const set = new Set<string>();
  for (const d of DEFAULT_RESEARCH_WORK_TYPES) set.add(d);
  for (const c of fromApi) {
    const t = c?.trim();
    if (t) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
}

type LoadedState =
  | { kind: "credential"; page: SpringPage<Credential> }
  | { kind: "insurance"; page: SpringPage<Insurance> }
  | { kind: "laborContract"; page: SpringPage<LaborContract> }
  | { kind: "researchWork"; page: SpringPage<ResearchWork> };

type FormState = {
  userId: string;
  credentialName: string;
  credentialCategory: string;
  issuingOrganization: string;
  credentialNumber: string;
  issueDate: string;
  expiryDate: string;
  insuranceType: string;
  policyNumber: string;
  provider: string;
  startDate: string;
  endDate: string;
  contractNumber: string;
  contractType: string;
  status: string;
  title: string;
  workType: string;
  publicationYear: string;
  venue: string;
  authorRole: string;
  notes: string;
  attachmentUrl: string;
};

const META: Record<
  UserRecordKind,
  {
    title: string;
    crumb: string;
    titleIcon: string;
    listTitle: string;
    sort: string;
    emptyHint: string;
  }
> = {
  credential: {
    title: "Chứng chỉ / văn bằng",
    crumb: "Chứng chỉ",
    titleIcon: "fa-solid fa-certificate",
    listTitle: "Danh sách chứng chỉ",
    sort: "id,desc",
    emptyHint: "Thử bộ lọc khác hoặc thêm chứng chỉ mới.",
  },
  insurance: {
    title: "Bảo hiểm",
    crumb: "Bảo hiểm",
    titleIcon: "fa-solid fa-hand-holding-medical",
    listTitle: "Danh sách bảo hiểm",
    sort: "id,desc",
    emptyHint: "Thử bộ lọc khác hoặc thêm bản ghi mới.",
  },
  laborContract: {
    title: "Hợp đồng lao động",
    crumb: "Hợp đồng",
    titleIcon: "fa-solid fa-file-contract",
    listTitle: "Danh sách hợp đồng",
    sort: "id,desc",
    emptyHint: "Thử bộ lọc khác hoặc thêm hợp đồng mới.",
  },
  researchWork: {
    title: "Công trình / bài báo",
    crumb: "Công trình",
    titleIcon: "fa-solid fa-book-open",
    listTitle: "Danh sách công trình",
    sort: "id,desc",
    emptyHint: "Thử bộ lọc khác hoặc thêm công trình mới.",
  },
};

function emptyForm(): FormState {
  return {
    userId: "",
    credentialName: "",
    credentialCategory: "",
    issuingOrganization: "",
    credentialNumber: "",
    issueDate: "",
    expiryDate: "",
    insuranceType: "",
    policyNumber: "",
    provider: "",
    startDate: "",
    endDate: "",
    contractNumber: "",
    contractType: "",
    status: "",
    title: "",
    workType: "",
    publicationYear: "",
    venue: "",
    authorRole: "",
    notes: "",
    attachmentUrl: "",
  };
}

export default function AdminUserRecordsClient({ kind }: { kind: UserRecordKind }) {
  const m = META[kind];
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const qParam = (searchParams.get("q") || "").trim();
  const userIdParam = (searchParams.get("userId") || "").trim();
  const categoryParam =
    kind === "credential" ? (searchParams.get("category") || "").trim() : "";
  const insuranceTypeParam =
    kind === "insurance" ? (searchParams.get("insuranceType") || "").trim() : "";
  const laborContractTypeParam =
    kind === "laborContract" ? (searchParams.get("contractType") || "").trim() : "";
  const researchWorkTypeParam =
    kind === "researchWork" ? (searchParams.get("workType") || "").trim() : "";

  const [draftQ, setDraftQ] = useState(qParam);
  const [draftUserId, setDraftUserId] = useState(userIdParam);

  const [loaded, setLoaded] = useState<LoadedState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [credentialFileUploading, setCredentialFileUploading] = useState(false);
  const [credentialFileError, setCredentialFileError] = useState<string | null>(null);
  const [insuranceFileUploading, setInsuranceFileUploading] = useState(false);
  const [insuranceFileError, setInsuranceFileError] = useState<string | null>(null);
  const [laborContractFileUploading, setLaborContractFileUploading] = useState(false);
  const [laborContractFileError, setLaborContractFileError] = useState<string | null>(null);
  const [researchWorkFileUploading, setResearchWorkFileUploading] = useState(false);
  const [researchWorkFileError, setResearchWorkFileError] = useState<string | null>(null);
  const [credentialCategoryOptions, setCredentialCategoryOptions] = useState<string[]>(() =>
    mergeCredentialCategoryOptions([])
  );
  const [extraCredentialCategories, setExtraCredentialCategories] = useState<string[]>([]);
  const [categoryAddModalOpen, setCategoryAddModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);
  const [insuranceTypeOptions, setInsuranceTypeOptions] = useState<string[]>(() =>
    mergeInsuranceTypeOptions([])
  );
  const [extraInsuranceTypes, setExtraInsuranceTypes] = useState<string[]>([]);
  const [insuranceTypeAddModalOpen, setInsuranceTypeAddModalOpen] = useState(false);
  const [newInsuranceTypeInput, setNewInsuranceTypeInput] = useState("");
  const [newInsuranceTypeError, setNewInsuranceTypeError] = useState<string | null>(null);
  const [laborContractTypeOptions, setLaborContractTypeOptions] = useState<string[]>(() =>
    mergeLaborContractTypeOptions([])
  );
  const [extraLaborContractTypes, setExtraLaborContractTypes] = useState<string[]>([]);
  const [laborContractTypeAddModalOpen, setLaborContractTypeAddModalOpen] = useState(false);
  const [newLaborContractTypeInput, setNewLaborContractTypeInput] = useState("");
  const [newLaborContractTypeError, setNewLaborContractTypeError] = useState<string | null>(null);
  const [researchWorkTypeOptions, setResearchWorkTypeOptions] = useState<string[]>(() =>
    mergeResearchWorkTypeOptions([])
  );
  const [extraResearchWorkTypes, setExtraResearchWorkTypes] = useState<string[]>([]);
  const [researchWorkTypeAddModalOpen, setResearchWorkTypeAddModalOpen] = useState(false);
  const [newResearchWorkTypeInput, setNewResearchWorkTypeInput] = useState("");
  const [newResearchWorkTypeError, setNewResearchWorkTypeError] = useState<string | null>(null);

  const mergedCategoryOptions = useMemo(
    () => mergeCredentialCategoryOptions([...credentialCategoryOptions, ...extraCredentialCategories]),
    [credentialCategoryOptions, extraCredentialCategories]
  );

  const mergedInsuranceTypeOptions = useMemo(
    () => mergeInsuranceTypeOptions([...insuranceTypeOptions, ...extraInsuranceTypes]),
    [insuranceTypeOptions, extraInsuranceTypes]
  );

  const mergedLaborContractTypeOptions = useMemo(
    () =>
      mergeLaborContractTypeOptions([...laborContractTypeOptions, ...extraLaborContractTypes]),
    [laborContractTypeOptions, extraLaborContractTypes]
  );

  const mergedResearchWorkTypeOptions = useMemo(
    () => mergeResearchWorkTypeOptions([...researchWorkTypeOptions, ...extraResearchWorkTypes]),
    [researchWorkTypeOptions, extraResearchWorkTypes]
  );

  useEffect(() => {
    setDraftQ(qParam);
    setDraftUserId(userIdParam);
  }, [qParam, userIdParam]);

  const navigateSearch = useCallback(
    (updates: Partial<{
      page: number;
      q: string | null;
      userId: string | null;
      category: string | null;
      insuranceType: string | null;
      contractType: string | null;
      workType: string | null;
    }>) => {
      const p = new URLSearchParams(searchParams.toString());
      if (kind !== "credential") {
        p.delete("category");
      }
      if (kind !== "insurance") {
        p.delete("insuranceType");
      }
      if (kind !== "laborContract") {
        p.delete("contractType");
      }
      if (kind !== "researchWork") {
        p.delete("workType");
      }
      if (updates.page !== undefined) {
        p.set("page", String(updates.page));
      }
      if ("q" in updates) {
        const v = updates.q == null ? "" : updates.q.trim();
        if (v) p.set("q", v);
        else p.delete("q");
      }
      if ("userId" in updates) {
        const v = updates.userId == null ? "" : updates.userId.trim();
        if (v) p.set("userId", v);
        else p.delete("userId");
      }
      if (kind === "credential" && "category" in updates) {
        const v = updates.category == null ? "" : updates.category.trim();
        if (v) p.set("category", v);
        else p.delete("category");
      }
      if (kind === "insurance" && "insuranceType" in updates) {
        const v = updates.insuranceType == null ? "" : updates.insuranceType.trim();
        if (v) p.set("insuranceType", v);
        else p.delete("insuranceType");
      }
      if (kind === "laborContract" && "contractType" in updates) {
        const v = updates.contractType == null ? "" : updates.contractType.trim();
        if (v) p.set("contractType", v);
        else p.delete("contractType");
      }
      if (kind === "researchWork" && "workType" in updates) {
        const v = updates.workType == null ? "" : updates.workType.trim();
        if (v) p.set("workType", v);
        else p.delete("workType");
      }
      router.push(`?${p.toString()}`);
    },
    [router, searchParams, kind]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const uid = userIdParam || undefined;
    const q = qParam || undefined;
    try {
      if (kind === "credential") {
        const cat = categoryParam || undefined;
        const [pageData, cats] = await Promise.all([
          fetchCredentialPage(page, 10, m.sort, q, uid, cat),
          fetchCredentialCategories().catch(() => [] as string[]),
        ]);
        setLoaded({ kind: "credential", page: pageData });
        setCredentialCategoryOptions(mergeCredentialCategoryOptions(cats));
      } else if (kind === "insurance") {
        const it = insuranceTypeParam || undefined;
        const [pageData, types] = await Promise.all([
          fetchInsurancePage(page, 10, m.sort, q, uid, it),
          fetchInsuranceTypes().catch(() => [] as string[]),
        ]);
        setLoaded({ kind: "insurance", page: pageData });
        setInsuranceTypeOptions(mergeInsuranceTypeOptions(types));
      } else if (kind === "laborContract") {
        const ct = laborContractTypeParam || undefined;
        const [pageData, types] = await Promise.all([
          fetchLaborContractPage(page, 10, m.sort, q, uid, ct),
          fetchLaborContractTypes().catch(() => [] as string[]),
        ]);
        setLoaded({ kind: "laborContract", page: pageData });
        setLaborContractTypeOptions(mergeLaborContractTypeOptions(types));
      } else {
        const wt = researchWorkTypeParam || undefined;
        const [pageData, types] = await Promise.all([
          fetchResearchWorkPage(page, 10, m.sort, q, uid, wt),
          fetchResearchWorkTypes().catch(() => [] as string[]),
        ]);
        setLoaded({ kind: "researchWork", page: pageData });
        setResearchWorkTypeOptions(mergeResearchWorkTypeOptions(types));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
      setLoaded(null);
    } finally {
      setLoading(false);
    }
  }, [
    kind,
    m.sort,
    page,
    qParam,
    userIdParam,
    categoryParam,
    insuranceTypeParam,
    laborContractTypeParam,
    researchWorkTypeParam,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!modalOpen) return;
    void fetchUserPage(0, 100, "createdAt,desc")
      .then((p) => setUserOptions(p.content))
      .catch(() => setUserOptions([]));
  }, [modalOpen]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    navigateSearch({ page: 0, q: draftQ, userId: draftUserId });
  }

  function clearFilters() {
    setDraftQ("");
    setDraftUserId("");
    if (kind === "credential") {
      navigateSearch({ page: 0, q: null, userId: null, category: null });
    } else if (kind === "insurance") {
      navigateSearch({ page: 0, q: null, userId: null, insuranceType: null });
    } else if (kind === "laborContract") {
      navigateSearch({ page: 0, q: null, userId: null, contractType: null });
    } else if (kind === "researchWork") {
      navigateSearch({ page: 0, q: null, userId: null, workType: null });
    } else {
      router.push("?page=0");
    }
  }

  function setPage(p: number) {
    navigateSearch({ page: p });
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setFieldErrors({});
    setCredentialFileError(null);
    setInsuranceFileError(null);
    setLaborContractFileError(null);
    setResearchWorkFileError(null);
    setModalOpen(true);
  }

  function openCreateWithCategory(categoryCode: string) {
    setEditingId(null);
    setForm({ ...emptyForm(), credentialCategory: categoryCode.trim() });
    setFormError(null);
    setFieldErrors({});
    setCredentialFileError(null);
    setInsuranceFileError(null);
    setLaborContractFileError(null);
    setResearchWorkFileError(null);
    setModalOpen(true);
  }

  function openCreateWithInsuranceType(typeCode: string) {
    setEditingId(null);
    setForm({ ...emptyForm(), insuranceType: typeCode.trim() });
    setFormError(null);
    setFieldErrors({});
    setCredentialFileError(null);
    setInsuranceFileError(null);
    setLaborContractFileError(null);
    setResearchWorkFileError(null);
    setModalOpen(true);
  }

  function openCreateWithLaborContractType(typeCode: string) {
    setEditingId(null);
    setForm({ ...emptyForm(), contractType: typeCode.trim() });
    setFormError(null);
    setFieldErrors({});
    setCredentialFileError(null);
    setInsuranceFileError(null);
    setLaborContractFileError(null);
    setResearchWorkFileError(null);
    setModalOpen(true);
  }

  function openCreateWithResearchWorkType(typeCode: string) {
    setEditingId(null);
    setForm({ ...emptyForm(), workType: typeCode.trim() });
    setFormError(null);
    setFieldErrors({});
    setCredentialFileError(null);
    setInsuranceFileError(null);
    setLaborContractFileError(null);
    setResearchWorkFileError(null);
    setModalOpen(true);
  }

  function openEdit(id: number) {
    if (!loaded || loaded.kind !== kind) return;
    const row = loaded.page.content.find((x) => x.id === id);
    if (!row) return;
    setEditingId(id);
    setFormError(null);
    setFieldErrors({});
    setCredentialFileError(null);
    setInsuranceFileError(null);
    setLaborContractFileError(null);
    setResearchWorkFileError(null);
    if (kind === "credential") {
      const r = row as Credential;
      setForm({
        ...emptyForm(),
        userId: r.userId,
        credentialName: r.credentialName,
        credentialCategory: r.credentialCategory,
        issuingOrganization: r.issuingOrganization ?? "",
        credentialNumber: r.credentialNumber ?? "",
        issueDate: r.issueDate,
        expiryDate: r.expiryDate ?? "",
        notes: r.notes ?? "",
        attachmentUrl: r.attachmentUrl ?? "",
      });
    } else if (kind === "insurance") {
      const r = row as Insurance;
      setForm({
        ...emptyForm(),
        userId: r.userId,
        insuranceType: r.insuranceType,
        policyNumber: r.policyNumber ?? "",
        provider: r.provider ?? "",
        startDate: r.startDate,
        endDate: r.endDate ?? "",
        notes: r.notes ?? "",
        attachmentUrl: r.attachmentUrl ?? "",
      });
    } else if (kind === "laborContract") {
      const r = row as LaborContract;
      setForm({
        ...emptyForm(),
        userId: r.userId,
        contractNumber: r.contractNumber,
        contractType: r.contractType ?? "",
        startDate: r.startDate,
        endDate: r.endDate ?? "",
        status: r.status ?? "",
        notes: r.notes ?? "",
        attachmentUrl: r.attachmentUrl ?? "",
      });
    } else {
      const r = row as ResearchWork;
      setForm({
        ...emptyForm(),
        userId: r.userId,
        title: r.title,
        workType: r.workType ?? "",
        publicationYear: r.publicationYear != null ? String(r.publicationYear) : "",
        venue: r.venue ?? "",
        authorRole: r.authorRole ?? "",
        notes: r.notes ?? "",
        attachmentUrl: r.attachmentUrl ?? "",
      });
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setCategoryAddModalOpen(false);
    setNewCategoryInput("");
    setNewCategoryError(null);
    setInsuranceTypeAddModalOpen(false);
    setNewInsuranceTypeInput("");
    setNewInsuranceTypeError(null);
    setLaborContractTypeAddModalOpen(false);
    setNewLaborContractTypeInput("");
    setNewLaborContractTypeError(null);
    setResearchWorkTypeAddModalOpen(false);
    setNewResearchWorkTypeInput("");
    setNewResearchWorkTypeError(null);
  }

  function openCredentialCategoryAddDialog() {
    setNewCategoryInput("");
    setNewCategoryError(null);
    setCategoryAddModalOpen(true);
  }

  function confirmAddCredentialCategory() {
    const raw = newCategoryInput.trim().replace(/\s+/g, "_");
    const code = raw.length > 0 ? raw : "";
    if (!code) {
      setNewCategoryError("Nhập mã loại (vd: CHUNG_CHI, BANG_CAP_2).");
      return;
    }
    if (code.length > 50) {
      setNewCategoryError("Mã loại tối đa 50 ký tự.");
      return;
    }
    const existing = mergeCredentialCategoryOptions([
      ...credentialCategoryOptions,
      ...extraCredentialCategories,
    ]);
    if (existing.some((c) => c.toLowerCase() === code.toLowerCase())) {
      setNewCategoryError("Mã loại này đã có trong danh sách.");
      return;
    }
    setExtraCredentialCategories((prev) => [...prev, code]);
    if (kind === "credential" && modalOpen) {
      setForm((f) => ({ ...f, credentialCategory: code }));
    } else if (kind === "credential") {
      navigateSearch({ page: 0, category: code });
    }
    setCategoryAddModalOpen(false);
    setNewCategoryInput("");
    setNewCategoryError(null);
  }

  function openInsuranceTypeAddDialog() {
    setNewInsuranceTypeInput("");
    setNewInsuranceTypeError(null);
    setInsuranceTypeAddModalOpen(true);
  }

  function confirmAddInsuranceType() {
    const raw = newInsuranceTypeInput.trim().replace(/\s+/g, "_");
    const code = raw.length > 0 ? raw : "";
    if (!code) {
      setNewInsuranceTypeError("Nhập mã loại (vd: BHXH_TU_NGUYEN).");
      return;
    }
    if (code.length > 100) {
      setNewInsuranceTypeError("Mã loại tối đa 100 ký tự.");
      return;
    }
    const existing = mergeInsuranceTypeOptions([
      ...insuranceTypeOptions,
      ...extraInsuranceTypes,
    ]);
    if (existing.some((c) => c.toLowerCase() === code.toLowerCase())) {
      setNewInsuranceTypeError("Mã loại này đã có trong danh sách.");
      return;
    }
    setExtraInsuranceTypes((prev) => [...prev, code]);
    if (kind === "insurance" && modalOpen) {
      setForm((f) => ({ ...f, insuranceType: code }));
    } else if (kind === "insurance") {
      navigateSearch({ page: 0, insuranceType: code });
    }
    setInsuranceTypeAddModalOpen(false);
    setNewInsuranceTypeInput("");
    setNewInsuranceTypeError(null);
  }

  function openLaborContractTypeAddDialog() {
    setNewLaborContractTypeInput("");
    setNewLaborContractTypeError(null);
    setLaborContractTypeAddModalOpen(true);
  }

  function confirmAddLaborContractType() {
    const raw = newLaborContractTypeInput.trim().replace(/\s+/g, "_");
    const code = raw.length > 0 ? raw : "";
    if (!code) {
      setNewLaborContractTypeError("Nhập mã loại (vd: HD_THU_VIEC_6T).");
      return;
    }
    if (code.length > 100) {
      setNewLaborContractTypeError("Mã loại tối đa 100 ký tự.");
      return;
    }
    const existing = mergeLaborContractTypeOptions([
      ...laborContractTypeOptions,
      ...extraLaborContractTypes,
    ]);
    if (existing.some((c) => c.toLowerCase() === code.toLowerCase())) {
      setNewLaborContractTypeError("Mã loại này đã có trong danh sách.");
      return;
    }
    setExtraLaborContractTypes((prev) => [...prev, code]);
    if (kind === "laborContract" && modalOpen) {
      setForm((f) => ({ ...f, contractType: code }));
    } else if (kind === "laborContract") {
      navigateSearch({ page: 0, contractType: code });
    }
    setLaborContractTypeAddModalOpen(false);
    setNewLaborContractTypeInput("");
    setNewLaborContractTypeError(null);
  }

  function openResearchWorkTypeAddDialog() {
    setNewResearchWorkTypeInput("");
    setNewResearchWorkTypeError(null);
    setResearchWorkTypeAddModalOpen(true);
  }

  function confirmAddResearchWorkType() {
    const raw = newResearchWorkTypeInput.trim().replace(/\s+/g, "_");
    const code = raw.length > 0 ? raw : "";
    if (!code) {
      setNewResearchWorkTypeError("Nhập mã loại (vd: BAI_BAO_Q1).");
      return;
    }
    if (code.length > 100) {
      setNewResearchWorkTypeError("Mã loại tối đa 100 ký tự.");
      return;
    }
    const existing = mergeResearchWorkTypeOptions([
      ...researchWorkTypeOptions,
      ...extraResearchWorkTypes,
    ]);
    if (existing.some((c) => c.toLowerCase() === code.toLowerCase())) {
      setNewResearchWorkTypeError("Mã loại này đã có trong danh sách.");
      return;
    }
    setExtraResearchWorkTypes((prev) => [...prev, code]);
    if (kind === "researchWork" && modalOpen) {
      setForm((f) => ({ ...f, workType: code }));
    } else if (kind === "researchWork") {
      navigateSearch({ page: 0, workType: code });
    }
    setResearchWorkTypeAddModalOpen(false);
    setNewResearchWorkTypeInput("");
    setNewResearchWorkTypeError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSaving(true);
    try {
      if (kind === "credential") {
        const payload: CredentialPayload = {
          userId: form.userId.trim(),
          credentialName: form.credentialName.trim(),
          credentialCategory: form.credentialCategory.trim(),
          issueDate: form.issueDate.trim(),
          issuingOrganization: form.issuingOrganization.trim() || undefined,
          credentialNumber: form.credentialNumber.trim() || undefined,
          expiryDate: form.expiryDate.trim() || undefined,
          notes: form.notes.trim() || undefined,
          attachmentUrl: form.attachmentUrl.trim() || undefined,
        };
        if (editingId == null) await createCredential(payload);
        else await updateCredential(editingId, payload);
      } else if (kind === "insurance") {
        const payload: InsurancePayload = {
          userId: form.userId.trim(),
          insuranceType: form.insuranceType.trim(),
          startDate: form.startDate.trim(),
          policyNumber: form.policyNumber.trim() || undefined,
          provider: form.provider.trim() || undefined,
          endDate: form.endDate.trim() || undefined,
          notes: form.notes.trim() || undefined,
          attachmentUrl: form.attachmentUrl.trim() || undefined,
        };
        if (editingId == null) await createInsurance(payload);
        else await updateInsurance(editingId, payload);
      } else if (kind === "laborContract") {
        const payload: LaborContractPayload = {
          userId: form.userId.trim(),
          contractNumber: form.contractNumber.trim(),
          startDate: form.startDate.trim(),
          contractType: form.contractType.trim() || undefined,
          endDate: form.endDate.trim() || undefined,
          status: form.status.trim() || undefined,
          notes: form.notes.trim() || undefined,
          attachmentUrl: form.attachmentUrl.trim() || undefined,
        };
        if (editingId == null) await createLaborContract(payload);
        else await updateLaborContract(editingId, payload);
      } else {
        const y = form.publicationYear.trim();
        const payload: ResearchWorkPayload = {
          userId: form.userId.trim(),
          title: form.title.trim(),
          workType: form.workType.trim() || undefined,
          publicationYear: y === "" ? undefined : Number(y),
          venue: form.venue.trim() || undefined,
          authorRole: form.authorRole.trim() || undefined,
          notes: form.notes.trim() || undefined,
          attachmentUrl: form.attachmentUrl.trim() || undefined,
        };
        if (Number.isNaN(payload.publicationYear)) {
          setFormError("Năm xuất bản không hợp lệ");
          setSaving(false);
          return;
        }
        if (editingId == null) await createResearchWork(payload);
        else await updateResearchWork(editingId, payload);
      }
      closeModal();
      await load();
    } catch (err) {
      const er = err as Error & { apiError?: ApiErrorBody };
      if (er.apiError?.details) setFieldErrors(er.apiError.details);
      setFormError(er.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa bản ghi này?")) return;
    try {
      if (kind === "credential") await deleteCredential(id);
      else if (kind === "insurance") await deleteInsurance(id);
      else if (kind === "laborContract") await deleteLaborContract(id);
      else await deleteResearchWork(id);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  const data = loaded && loaded.kind === kind ? loaded.page : null;

  const credentialCategorySelectList = useMemo(() => {
    const opts = [...mergedCategoryOptions];
    const cur = form.credentialCategory.trim();
    if (cur && !opts.some((x) => x.toLowerCase() === cur.toLowerCase())) {
      opts.push(cur);
      opts.sort((a, b) => a.localeCompare(b, "vi"));
    }
    return opts;
  }, [mergedCategoryOptions, form.credentialCategory]);

  const insuranceTypeSelectList = useMemo(() => {
    const opts = [...mergedInsuranceTypeOptions];
    const cur = form.insuranceType.trim();
    if (cur && !opts.some((x) => x.toLowerCase() === cur.toLowerCase())) {
      opts.push(cur);
      opts.sort((a, b) => a.localeCompare(b, "vi"));
    }
    return opts;
  }, [mergedInsuranceTypeOptions, form.insuranceType]);

  const laborContractTypeSelectList = useMemo(() => {
    const opts = [...mergedLaborContractTypeOptions];
    const cur = form.contractType.trim();
    if (cur && !opts.some((x) => x.toLowerCase() === cur.toLowerCase())) {
      opts.push(cur);
      opts.sort((a, b) => a.localeCompare(b, "vi"));
    }
    return opts;
  }, [mergedLaborContractTypeOptions, form.contractType]);

  const researchWorkTypeSelectList = useMemo(() => {
    const opts = [...mergedResearchWorkTypeOptions];
    const cur = form.workType.trim();
    if (cur && !opts.some((x) => x.toLowerCase() === cur.toLowerCase())) {
      opts.push(cur);
      opts.sort((a, b) => a.localeCompare(b, "vi"));
    }
    return opts;
  }, [mergedResearchWorkTypeOptions, form.workType]);

  return (
    <>
      <ContentHeader
        title={m.title}
        titleIcon={m.titleIcon}
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin" },
          { label: m.crumb },
        ]}
      />

      <LteCard
        title={m.listTitle}
        titleIcon="fa-solid fa-list-check"
        tools={
          kind === "credential" && categoryParam ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => openCreateWithCategory(categoryParam)}
                className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
              >
                <FaIcon icon="fa-solid fa-plus" />
                Thêm &quot;{credentialCategoryLabel(categoryParam)}&quot;
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="lte-btn lte-btn-ghost lte-btn-sm border border-[#dee2e6]"
              >
                <FaIcon icon="fa-solid fa-list-ul" />
                Thêm khác loại…
              </button>
            </div>
          ) : kind === "insurance" && insuranceTypeParam ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => openCreateWithInsuranceType(insuranceTypeParam)}
                className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
              >
                <FaIcon icon="fa-solid fa-plus" />
                Thêm &quot;{insuranceTypeLabel(insuranceTypeParam)}&quot;
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="lte-btn lte-btn-ghost lte-btn-sm border border-[#dee2e6]"
              >
                <FaIcon icon="fa-solid fa-list-ul" />
                Thêm loại khác…
              </button>
            </div>
          ) : kind === "laborContract" && laborContractTypeParam ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => openCreateWithLaborContractType(laborContractTypeParam)}
                className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
              >
                <FaIcon icon="fa-solid fa-plus" />
                Thêm &quot;{laborContractTypeLabel(laborContractTypeParam)}&quot;
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="lte-btn lte-btn-ghost lte-btn-sm border border-[#dee2e6]"
              >
                <FaIcon icon="fa-solid fa-list-ul" />
                Thêm loại khác…
              </button>
            </div>
          ) : kind === "researchWork" && researchWorkTypeParam ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => openCreateWithResearchWorkType(researchWorkTypeParam)}
                className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
              >
                <FaIcon icon="fa-solid fa-plus" />
                Thêm &quot;{researchWorkTypeLabel(researchWorkTypeParam)}&quot;
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="lte-btn lte-btn-ghost lte-btn-sm border border-[#dee2e6]"
              >
                <FaIcon icon="fa-solid fa-list-ul" />
                Thêm loại khác…
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openCreate}
              className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
            >
              <FaIcon icon="fa-solid fa-plus" />
              Thêm mới
            </button>
          )
        }
      >
        <form
          onSubmit={applyFilters}
          className="mb-4 flex flex-col gap-3 rounded-xl border border-[#eef2f6] bg-[#fafcfd] p-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="min-w-[12rem] flex-1">
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#6c757d]">
              <FaIcon icon="fa-solid fa-magnifying-glass" className="text-[#3c8dbc]" />
              Từ khóa
            </label>
            <input
              className="lte-input w-full"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Tìm trong bản ghi…"
            />
          </div>
          <div className="min-w-[12rem] flex-1">
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#6c757d]">
              <FaIcon icon="fa-solid fa-id-card" className="text-[#3c8dbc]" />
              Mã người dùng (UUID)
            </label>
            <input
              className="lte-input w-full font-mono text-xs"
              value={draftUserId}
              onChange={(e) => setDraftUserId(e.target.value)}
              placeholder="Lọc theo userId…"
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="submit" className="lte-btn lte-btn-primary lte-btn-sm">
              <FaIcon icon="fa-solid fa-filter" />
              Áp dụng
            </button>
            {(qParam ||
              userIdParam ||
              (kind === "credential" && categoryParam) ||
              (kind === "insurance" && insuranceTypeParam) ||
              (kind === "laborContract" && laborContractTypeParam) ||
              (kind === "researchWork" && researchWorkTypeParam)) && (
              <button type="button" onClick={clearFilters} className="lte-btn lte-btn-ghost lte-btn-sm">
                <FaIcon icon="fa-solid fa-xmark" />
                Xóa lọc
              </button>
            )}
          </div>
          <p className="flex w-full items-start gap-1.5 text-xs text-[#6c757d]">
            <FaIcon icon="fa-solid fa-circle-info" className="mt-0.5 shrink-0 text-[#3c8dbc]" />
            <span>
              Xem danh sách người dùng để lấy{" "}
              <Link href="/admin/users" className="font-medium text-[#3c8dbc] hover:underline">
                UUID
              </Link>
              .
            </span>
          </p>
        </form>

        {kind === "credential" && (
          <div className="mb-4 rounded-xl border border-[#e3e8ec] bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#495057]">
                <FaIcon icon="fa-solid fa-layer-group" className="text-[#3c8dbc]" />
                <span>Chọn loại chứng chỉ</span>
                <button
                  type="button"
                  onClick={openCredentialCategoryAddDialog}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#3c8dbc]/35 bg-[#3c8dbc]/8 text-[#2f7494] transition-colors hover:bg-[#3c8dbc]/15"
                  title="Thêm mã loại chứng chỉ mới"
                  aria-label="Thêm mã loại chứng chỉ mới"
                >
                  <FaIcon icon="fa-solid fa-square-plus" className="text-base" />
                </button>
              </div>
              {categoryParam ? (
                <button
                  type="button"
                  onClick={() => openCreateWithCategory(categoryParam)}
                  className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
                >
                  <FaIcon icon="fa-solid fa-plus" />
                  Thêm chứng chỉ mới ({credentialCategoryLabel(categoryParam)})
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigateSearch({ page: 0, category: null })}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  !categoryParam
                    ? "border-[#3c8dbc] bg-[#3c8dbc]/12 text-[#2f7494]"
                    : "border-[#dee2e6] bg-[#f8fafc] text-[#5a6c7d] hover:border-[#3c8dbc]/40"
                }`}
              >
                <FaIcon icon="fa-solid fa-border-all" />
                Tất cả loại
              </button>
              {mergedCategoryOptions.map((cat) => {
                const active = categoryParam === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => navigateSearch({ page: 0, category: cat })}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-[#3c8dbc] bg-[#3c8dbc]/12 text-[#2f7494]"
                        : "border-[#dee2e6] bg-[#f8fafc] text-[#5a6c7d] hover:border-[#3c8dbc]/40"
                    }`}
                  >
                    <FaIcon icon="fa-solid fa-tag" className="opacity-80" />
                    <span className="mr-1">{credentialCategoryLabel(cat)}</span>
                    <span className="font-mono text-[10px] opacity-80">({cat})</span>
                  </button>
                );
              })}
            </div>
            {categoryParam ? (
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[#6c757d]">
                <FaIcon icon="fa-solid fa-filter" className="mt-0.5 shrink-0 text-[#3c8dbc]" />
                <span>
                  Đang lọc danh sách theo loại{" "}
                  <strong className="text-[#495057]">{credentialCategoryLabel(categoryParam)}</strong>.
                  Bấm nút phía trên để thêm chứng chỉ mới cùng loại, hoặc chọn loại khác.
                </span>
              </p>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-xs text-[#6c757d]">
                <FaIcon icon="fa-solid fa-hand-pointer" className="mt-0.5 shrink-0 text-[#adb5bd]" />
                <span>
                  Bấm một loại để xem chứng chỉ thuộc loại đó và thêm bản ghi mới đúng loại.
                </span>
              </p>
            )}
          </div>
        )}

        {kind === "insurance" && (
          <div className="mb-4 rounded-xl border border-[#e3e8ec] bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#495057]">
                <FaIcon icon="fa-solid fa-layer-group" className="text-[#3c8dbc]" />
                <span>Chọn loại bảo hiểm</span>
                <button
                  type="button"
                  onClick={openInsuranceTypeAddDialog}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#3c8dbc]/35 bg-[#3c8dbc]/8 text-[#2f7494] transition-colors hover:bg-[#3c8dbc]/15"
                  title="Thêm mã loại bảo hiểm mới"
                  aria-label="Thêm mã loại bảo hiểm mới"
                >
                  <FaIcon icon="fa-solid fa-square-plus" className="text-base" />
                </button>
              </div>
              {insuranceTypeParam ? (
                <button
                  type="button"
                  onClick={() => openCreateWithInsuranceType(insuranceTypeParam)}
                  className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
                >
                  <FaIcon icon="fa-solid fa-plus" />
                  Thêm bảo hiểm mới ({insuranceTypeLabel(insuranceTypeParam)})
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigateSearch({ page: 0, insuranceType: null })}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  !insuranceTypeParam
                    ? "border-[#3c8dbc] bg-[#3c8dbc]/12 text-[#2f7494]"
                    : "border-[#dee2e6] bg-[#f8fafc] text-[#5a6c7d] hover:border-[#3c8dbc]/40"
                }`}
              >
                <FaIcon icon="fa-solid fa-border-all" />
                Tất cả loại
              </button>
              {mergedInsuranceTypeOptions.map((t) => {
                const active = insuranceTypeParam === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => navigateSearch({ page: 0, insuranceType: t })}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-[#3c8dbc] bg-[#3c8dbc]/12 text-[#2f7494]"
                        : "border-[#dee2e6] bg-[#f8fafc] text-[#5a6c7d] hover:border-[#3c8dbc]/40"
                    }`}
                  >
                    <FaIcon icon="fa-solid fa-tag" className="opacity-80" />
                    <span className="mr-1">{insuranceTypeLabel(t)}</span>
                    <span className="font-mono text-[10px] opacity-80">({t})</span>
                  </button>
                );
              })}
            </div>
            {insuranceTypeParam ? (
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[#6c757d]">
                <FaIcon icon="fa-solid fa-filter" className="mt-0.5 shrink-0 text-[#3c8dbc]" />
                <span>
                  Đang lọc danh sách theo loại{" "}
                  <strong className="text-[#495057]">{insuranceTypeLabel(insuranceTypeParam)}</strong>.
                  Bấm nút phía trên để thêm bản ghi mới cùng loại, hoặc chọn loại khác.
                </span>
              </p>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-xs text-[#6c757d]">
                <FaIcon icon="fa-solid fa-hand-pointer" className="mt-0.5 shrink-0 text-[#adb5bd]" />
                <span>
                  Bấm một loại để xem bảo hiểm thuộc loại đó và thêm bản ghi mới đúng loại.
                </span>
              </p>
            )}
          </div>
        )}

        {kind === "laborContract" && (
          <div className="mb-4 rounded-xl border border-[#e3e8ec] bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#495057]">
                <FaIcon icon="fa-solid fa-layer-group" className="text-[#3c8dbc]" />
                <span>Chọn loại hợp đồng</span>
                <button
                  type="button"
                  onClick={openLaborContractTypeAddDialog}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#3c8dbc]/35 bg-[#3c8dbc]/8 text-[#2f7494] transition-colors hover:bg-[#3c8dbc]/15"
                  title="Thêm mã loại hợp đồng mới"
                  aria-label="Thêm mã loại hợp đồng mới"
                >
                  <FaIcon icon="fa-solid fa-square-plus" className="text-base" />
                </button>
              </div>
              {laborContractTypeParam ? (
                <button
                  type="button"
                  onClick={() => openCreateWithLaborContractType(laborContractTypeParam)}
                  className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
                >
                  <FaIcon icon="fa-solid fa-plus" />
                  Thêm hợp đồng mới ({laborContractTypeLabel(laborContractTypeParam)})
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigateSearch({ page: 0, contractType: null })}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  !laborContractTypeParam
                    ? "border-[#3c8dbc] bg-[#3c8dbc]/12 text-[#2f7494]"
                    : "border-[#dee2e6] bg-[#f8fafc] text-[#5a6c7d] hover:border-[#3c8dbc]/40"
                }`}
              >
                <FaIcon icon="fa-solid fa-border-all" />
                Tất cả loại
              </button>
              {mergedLaborContractTypeOptions.map((t) => {
                const active = laborContractTypeParam === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => navigateSearch({ page: 0, contractType: t })}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-[#3c8dbc] bg-[#3c8dbc]/12 text-[#2f7494]"
                        : "border-[#dee2e6] bg-[#f8fafc] text-[#5a6c7d] hover:border-[#3c8dbc]/40"
                    }`}
                  >
                    <FaIcon icon="fa-solid fa-tag" className="opacity-80" />
                    <span className="mr-1">{laborContractTypeLabel(t)}</span>
                    <span className="font-mono text-[10px] opacity-80">({t})</span>
                  </button>
                );
              })}
            </div>
            {laborContractTypeParam ? (
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[#6c757d]">
                <FaIcon icon="fa-solid fa-filter" className="mt-0.5 shrink-0 text-[#3c8dbc]" />
                <span>
                  Đang lọc danh sách theo loại{" "}
                  <strong className="text-[#495057]">
                    {laborContractTypeLabel(laborContractTypeParam)}
                  </strong>
                  . Bấm nút phía trên để thêm hợp đồng mới cùng loại, hoặc chọn loại khác.
                </span>
              </p>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-xs text-[#6c757d]">
                <FaIcon icon="fa-solid fa-hand-pointer" className="mt-0.5 shrink-0 text-[#adb5bd]" />
                <span>
                  Bấm một loại để xem hợp đồng thuộc loại đó và thêm bản ghi mới đúng loại.
                </span>
              </p>
            )}
          </div>
        )}

        {kind === "researchWork" && (
          <div className="mb-4 rounded-xl border border-[#e3e8ec] bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#495057]">
                <FaIcon icon="fa-solid fa-layer-group" className="text-[#3c8dbc]" />
                <span>Chọn loại công trình</span>
                <button
                  type="button"
                  onClick={openResearchWorkTypeAddDialog}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#3c8dbc]/35 bg-[#3c8dbc]/8 text-[#2f7494] transition-colors hover:bg-[#3c8dbc]/15"
                  title="Thêm mã loại công trình mới"
                  aria-label="Thêm mã loại công trình mới"
                >
                  <FaIcon icon="fa-solid fa-square-plus" className="text-base" />
                </button>
              </div>
              {researchWorkTypeParam ? (
                <button
                  type="button"
                  onClick={() => openCreateWithResearchWorkType(researchWorkTypeParam)}
                  className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
                >
                  <FaIcon icon="fa-solid fa-plus" />
                  Thêm công trình mới ({researchWorkTypeLabel(researchWorkTypeParam)})
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigateSearch({ page: 0, workType: null })}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  !researchWorkTypeParam
                    ? "border-[#3c8dbc] bg-[#3c8dbc]/12 text-[#2f7494]"
                    : "border-[#dee2e6] bg-[#f8fafc] text-[#5a6c7d] hover:border-[#3c8dbc]/40"
                }`}
              >
                <FaIcon icon="fa-solid fa-border-all" />
                Tất cả loại
              </button>
              {mergedResearchWorkTypeOptions.map((t) => {
                const active = researchWorkTypeParam === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => navigateSearch({ page: 0, workType: t })}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-[#3c8dbc] bg-[#3c8dbc]/12 text-[#2f7494]"
                        : "border-[#dee2e6] bg-[#f8fafc] text-[#5a6c7d] hover:border-[#3c8dbc]/40"
                    }`}
                  >
                    <FaIcon icon="fa-solid fa-tag" className="opacity-80" />
                    <span className="mr-1">{researchWorkTypeLabel(t)}</span>
                    <span className="font-mono text-[10px] opacity-80">({t})</span>
                  </button>
                );
              })}
            </div>
            {researchWorkTypeParam ? (
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[#6c757d]">
                <FaIcon icon="fa-solid fa-filter" className="mt-0.5 shrink-0 text-[#3c8dbc]" />
                <span>
                  Đang lọc danh sách theo loại{" "}
                  <strong className="text-[#495057]">{researchWorkTypeLabel(researchWorkTypeParam)}</strong>.
                  Bấm nút phía trên để thêm bản ghi mới cùng loại, hoặc chọn loại khác.
                </span>
              </p>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-xs text-[#6c757d]">
                <FaIcon icon="fa-solid fa-hand-pointer" className="mt-0.5 shrink-0 text-[#adb5bd]" />
                <span>
                  Bấm một loại để xem công trình thuộc loại đó và thêm bản ghi mới đúng loại.
                </span>
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <FaIcon icon="fa-solid fa-circle-exclamation" className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-[#6c757d]">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-3xl text-[#3c8dbc]" />
            <p className="text-sm font-medium">Đang tải…</p>
          </div>
        )}
        {!loading && data && (
          <>
            <div className="lte-table-wrap overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <FaIcon icon="fa-solid fa-user" className="text-[#3c8dbc]" />
                        Người dùng
                      </span>
                    </th>
                    {kind === "credential" && (
                      <>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-certificate" className="text-[#3c8dbc]" />
                            Chứng chỉ
                          </span>
                        </th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-tags" className="text-[#3c8dbc]" />
                            Loại
                          </span>
                        </th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-calendar-check" className="text-[#3c8dbc]" />
                            Cấp ngày
                          </span>
                        </th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-paperclip" className="text-[#3c8dbc]" />
                            File
                          </span>
                        </th>
                      </>
                    )}
                    {kind === "insurance" && (
                      <>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-shield-heart" className="text-[#3c8dbc]" />
                            Loại BH
                          </span>
                        </th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-hashtag" className="text-[#3c8dbc]" />
                            Số HĐ
                          </span>
                        </th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-calendar-day" className="text-[#3c8dbc]" />
                            Bắt đầu
                          </span>
                        </th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-paperclip" className="text-[#3c8dbc]" />
                            File
                          </span>
                        </th>
                      </>
                    )}
                    {kind === "laborContract" && (
                      <>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-file-signature" className="text-[#3c8dbc]" />
                            Số HĐ
                          </span>
                        </th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-file-contract" className="text-[#3c8dbc]" />
                            Loại
                          </span>
                        </th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-signal" className="text-[#3c8dbc]" />
                            Trạng thái
                          </span>
                        </th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-paperclip" className="text-[#3c8dbc]" />
                            File
                          </span>
                        </th>
                      </>
                    )}
                    {kind === "researchWork" && (
                      <>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-heading" className="text-[#3c8dbc]" />
                            Tiêu đề
                          </span>
                        </th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-bookmark" className="text-[#3c8dbc]" />
                            Loại
                          </span>
                        </th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-calendar" className="text-[#3c8dbc]" />
                            Năm
                          </span>
                        </th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 text-left font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <FaIcon icon="fa-solid fa-paperclip" className="text-[#3c8dbc]" />
                            File
                          </span>
                        </th>
                      </>
                    )}
                    <th className="border-b border-[#e3e8ec] px-3 py-3 text-right font-semibold">
                      <span className="inline-flex items-center justify-end gap-1.5">
                        <FaIcon icon="fa-solid fa-gear" className="text-[#3c8dbc]" />
                        Thao tác
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.length === 0 && (
                    <tr>
                      <td
                        colSpan={
                          kind === "credential" ||
                          kind === "insurance" ||
                          kind === "laborContract" ||
                          kind === "researchWork"
                            ? 6
                            : 5
                        }
                        className="px-4 py-14 text-center text-[#6c757d]"
                      >
                        <FaIcon icon="fa-solid fa-inbox" className="mb-2 text-4xl text-[#dee2e6]" />
                        <p className="text-sm font-medium text-[#495057]">Không có dữ liệu</p>
                        <p className="text-xs">{m.emptyHint}</p>
                      </td>
                    </tr>
                  )}
                  {kind === "credential" &&
                    (data as SpringPage<Credential>).content.map((r) => (
                      <tr key={r.id} className="border-b border-[#f0f3f6]">
                        <td className="px-3 py-2">
                          <div className="font-medium text-[#2c3e50]">{r.userFullName || "—"}</div>
                          <div className="font-mono text-[10px] text-[#6c757d]">{r.userId}</div>
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-2">{r.credentialName}</td>
                        <td className="px-3 py-2">{r.credentialCategory}</td>
                        <td className="whitespace-nowrap px-3 py-2">{r.issueDate}</td>
                        <td className="px-3 py-2">
                          {r.attachmentUrl ? (
                            <a
                              href={backendPublicFileUrl(r.attachmentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#3c8dbc] hover:underline"
                            >
                              <FaIcon icon="fa-solid fa-paperclip" />
                              Mở
                            </a>
                          ) : (
                            <span className="text-[#adb5bd]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEdit(r.id)}
                            className="lte-btn lte-btn-ghost lte-btn-sm mr-1 text-[#3c8dbc]"
                          >
                            <FaIcon icon="fa-solid fa-pen-to-square" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(r.id)}
                            className="lte-btn lte-btn-danger lte-btn-sm"
                          >
                            <FaIcon icon="fa-solid fa-trash-can" />
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  {kind === "insurance" &&
                    (data as SpringPage<Insurance>).content.map((r) => (
                      <tr key={r.id} className="border-b border-[#f0f3f6]">
                        <td className="px-3 py-2">
                          <div className="font-medium text-[#2c3e50]">{r.userFullName || "—"}</div>
                          <div className="font-mono text-[10px] text-[#6c757d]">{r.userId}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-[#2c3e50]">{insuranceTypeLabel(r.insuranceType)}</div>
                          <div className="font-mono text-[10px] text-[#6c757d]">{r.insuranceType}</div>
                        </td>
                        <td className="px-3 py-2">{r.policyNumber || "—"}</td>
                        <td className="whitespace-nowrap px-3 py-2">{r.startDate}</td>
                        <td className="px-3 py-2">
                          {r.attachmentUrl ? (
                            <a
                              href={backendPublicFileUrl(r.attachmentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#3c8dbc] hover:underline"
                            >
                              <FaIcon icon="fa-solid fa-paperclip" />
                              Mở
                            </a>
                          ) : (
                            <span className="text-[#adb5bd]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEdit(r.id)}
                            className="lte-btn lte-btn-ghost lte-btn-sm mr-1 text-[#3c8dbc]"
                          >
                            <FaIcon icon="fa-solid fa-pen-to-square" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(r.id)}
                            className="lte-btn lte-btn-danger lte-btn-sm"
                          >
                            <FaIcon icon="fa-solid fa-trash-can" />
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  {kind === "laborContract" &&
                    (data as SpringPage<LaborContract>).content.map((r) => (
                      <tr key={r.id} className="border-b border-[#f0f3f6]">
                        <td className="px-3 py-2">
                          <div className="font-medium text-[#2c3e50]">{r.userFullName || "—"}</div>
                          <div className="font-mono text-[10px] text-[#6c757d]">{r.userId}</div>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{r.contractNumber}</td>
                        <td className="px-3 py-2">
                          {r.contractType ? (
                            <>
                              <div className="font-medium text-[#2c3e50]">
                                {laborContractTypeLabel(r.contractType)}
                              </div>
                              <div className="font-mono text-[10px] text-[#6c757d]">{r.contractType}</div>
                            </>
                          ) : (
                            <span className="text-[#adb5bd]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{r.status || "—"}</td>
                        <td className="px-3 py-2">
                          {r.attachmentUrl ? (
                            <a
                              href={backendPublicFileUrl(r.attachmentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#3c8dbc] hover:underline"
                            >
                              <FaIcon icon="fa-solid fa-paperclip" />
                              Mở
                            </a>
                          ) : (
                            <span className="text-[#adb5bd]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEdit(r.id)}
                            className="lte-btn lte-btn-ghost lte-btn-sm mr-1 text-[#3c8dbc]"
                          >
                            <FaIcon icon="fa-solid fa-pen-to-square" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(r.id)}
                            className="lte-btn lte-btn-danger lte-btn-sm"
                          >
                            <FaIcon icon="fa-solid fa-trash-can" />
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  {kind === "researchWork" &&
                    (data as SpringPage<ResearchWork>).content.map((r) => (
                      <tr key={r.id} className="border-b border-[#f0f3f6]">
                        <td className="px-3 py-2">
                          <div className="font-medium text-[#2c3e50]">{r.userFullName || "—"}</div>
                          <div className="font-mono text-[10px] text-[#6c757d]">{r.userId}</div>
                        </td>
                        <td className="max-w-[220px] truncate px-3 py-2">{r.title}</td>
                        <td className="px-3 py-2">
                          {r.workType ? (
                            <>
                              <div className="font-medium text-[#2c3e50]">{researchWorkTypeLabel(r.workType)}</div>
                              <div className="font-mono text-[10px] text-[#6c757d]">{r.workType}</div>
                            </>
                          ) : (
                            <span className="text-[#adb5bd]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{r.publicationYear ?? "—"}</td>
                        <td className="px-3 py-2">
                          {r.attachmentUrl ? (
                            <a
                              href={backendPublicFileUrl(r.attachmentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#3c8dbc] hover:underline"
                            >
                              <FaIcon icon="fa-solid fa-paperclip" />
                              Mở
                            </a>
                          ) : (
                            <span className="text-[#adb5bd]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEdit(r.id)}
                            className="lte-btn lte-btn-ghost lte-btn-sm mr-1 text-[#3c8dbc]"
                          >
                            <FaIcon icon="fa-solid fa-pen-to-square" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(r.id)}
                            className="lte-btn lte-btn-danger lte-btn-sm"
                          >
                            <FaIcon icon="fa-solid fa-trash-can" />
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {data.totalPages > 1 && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f6] pt-4 text-sm text-[#6c757d]">
                <span className="inline-flex items-center gap-2">
                  <FaIcon icon="fa-solid fa-file-lines" className="text-[#adb5bd]" />
                  Trang {data.number + 1}/{data.totalPages} — {data.totalElements} bản ghi
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={data.first}
                    onClick={() => setPage(page - 1)}
                    className="lte-btn lte-btn-ghost lte-btn-sm disabled:opacity-40"
                  >
                    <FaIcon icon="fa-solid fa-chevron-left" />
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={data.last}
                    onClick={() => setPage(page + 1)}
                    className="lte-btn lte-btn-ghost lte-btn-sm disabled:opacity-40"
                  >
                    Sau
                    <FaIcon icon="fa-solid fa-chevron-right" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </LteCard>

      {modalOpen && (
        <div className="lte-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div
            className="lte-modal-panel max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8ecf0] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-[#eef2f6] px-5 py-4">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-[#2c3e50]">
                <FaIcon
                  icon={
                    editingId == null ? "fa-solid fa-circle-plus" : "fa-solid fa-pen-to-square"
                  }
                  className="text-[#3c8dbc]"
                />
                {editingId == null ? "Thêm mới" : "Chỉnh sửa"}
              </h4>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6c757d] hover:bg-[#f1f3f5]"
                aria-label="Đóng"
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-xl" />
              </button>
            </div>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 p-5">
              {formError && (
                <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  <FaIcon icon="fa-solid fa-triangle-exclamation" className="mt-0.5 shrink-0" />
                  {formError}
                </p>
              )}

              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#495057]">
                  <FaIcon icon="fa-solid fa-user" className="text-[#3c8dbc]" />
                  Người dùng <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="lte-input w-full"
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                >
                  <option value="">— Chọn —</option>
                  {userOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.username} ({u.username})
                    </option>
                  ))}
                </select>
                {fieldErrors.userId && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.userId}</p>
                )}
              </div>

              {kind === "credential" && (
                <>
                  <TextField
                    label="Tên chứng chỉ"
                    labelIcon="fa-solid fa-signature"
                    required
                    value={form.credentialName}
                    onChange={(v) => setForm((f) => ({ ...f, credentialName: v }))}
                    error={fieldErrors.credentialName}
                  />
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#495057]">
                        <FaIcon icon="fa-solid fa-tags" className="text-[#3c8dbc]" />
                        Loại chứng chỉ (mã) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={openCredentialCategoryAddDialog}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#3c8dbc]/40 bg-[#3c8dbc]/10 text-[#2f7494] transition-colors hover:bg-[#3c8dbc]/20"
                        title="Thêm mã loại chứng chỉ mới"
                        aria-label="Thêm mã loại chứng chỉ mới"
                      >
                        <FaIcon icon="fa-solid fa-square-plus" className="text-lg" />
                      </button>
                    </div>
                    <p className="mb-1.5 flex items-start gap-1.5 text-xs text-[#6c757d]">
                      <FaIcon icon="fa-solid fa-lightbulb" className="mt-0.5 shrink-0 text-[#adb5bd]" />
                      <span>
                        Chọn từ gợi ý hoặc gõ mã tùy chỉnh. Gợi ý: CHUNG_CHI, BANG_CAP. Bấm (+) để
                        thêm loại mới vào danh sách.
                      </span>
                    </p>
                    <input
                      required
                      className="lte-input w-full"
                      list="admin-credential-category-datalist"
                      value={form.credentialCategory}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, credentialCategory: e.target.value }))
                      }
                    />
                    <datalist id="admin-credential-category-datalist">
                      {credentialCategorySelectList.map((c) => (
                        <option key={c} value={c} label={credentialCategoryLabel(c)} />
                      ))}
                    </datalist>
                    {fieldErrors.credentialCategory && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.credentialCategory}</p>
                    )}
                  </div>
                  <TextField
                    label="Cơ quan cấp"
                    labelIcon="fa-solid fa-building"
                    value={form.issuingOrganization}
                    onChange={(v) => setForm((f) => ({ ...f, issuingOrganization: v }))}
                    error={fieldErrors.issuingOrganization}
                  />
                  <TextField
                    label="Số hiệu"
                    labelIcon="fa-solid fa-hashtag"
                    value={form.credentialNumber}
                    onChange={(v) => setForm((f) => ({ ...f, credentialNumber: v }))}
                    error={fieldErrors.credentialNumber}
                  />
                  <TextField
                    label="Ngày cấp"
                    labelIcon="fa-solid fa-calendar-check"
                    type="date"
                    required
                    value={form.issueDate}
                    onChange={(v) => setForm((f) => ({ ...f, issueDate: v }))}
                    error={fieldErrors.issueDate}
                  />
                  <TextField
                    label="Ngày hết hạn"
                    labelIcon="fa-solid fa-calendar-xmark"
                    type="date"
                    value={form.expiryDate}
                    onChange={(v) => setForm((f) => ({ ...f, expiryDate: v }))}
                    error={fieldErrors.expiryDate}
                  />
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#495057]">
                      <FaIcon icon="fa-solid fa-file-arrow-up" className="text-[#3c8dbc]" />
                      File đính kèm
                    </label>
                    <p className="mb-2 text-xs text-[#6c757d]">
                      PDF, ảnh scan hoặc Word — tối đa 10MB. Cần đăng nhập quản trị để upload.
                    </p>
                    <input
                      key={form.attachmentUrl || "no-file"}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,application/pdf,image/*"
                      disabled={credentialFileUploading}
                      className="lte-input w-full cursor-pointer text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#3c8dbc]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#2f7494]"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setCredentialFileError(null);
                        setCredentialFileUploading(true);
                        void uploadCredentialDocument(f)
                          .then(({ url }) => {
                            setForm((prev) => ({ ...prev, attachmentUrl: url }));
                          })
                          .catch((err) => {
                            setCredentialFileError(
                              err instanceof Error ? err.message : "Upload thất bại"
                            );
                          })
                          .finally(() => {
                            setCredentialFileUploading(false);
                            e.target.value = "";
                          });
                      }}
                    />
                    {credentialFileUploading && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-[#3c8dbc]">
                        <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                        Đang tải file lên…
                      </p>
                    )}
                    {credentialFileError && (
                      <p className="mt-2 text-xs text-red-600">{credentialFileError}</p>
                    )}
                    {fieldErrors.attachmentUrl && (
                      <p className="mt-2 text-xs text-red-600">{fieldErrors.attachmentUrl}</p>
                    )}
                    {form.attachmentUrl ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <a
                          href={backendPublicFileUrl(form.attachmentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lte-btn lte-btn-ghost lte-btn-sm border border-[#dee2e6] text-[#3c8dbc]"
                        >
                          <FaIcon icon="fa-solid fa-eye" />
                          Xem file hiện tại
                        </a>
                        <button
                          type="button"
                          className="lte-btn lte-btn-ghost lte-btn-sm text-[#6c757d]"
                          onClick={() => setForm((prev) => ({ ...prev, attachmentUrl: "" }))}
                        >
                          <FaIcon icon="fa-solid fa-xmark" />
                          Gỡ file
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              )}

              {kind === "insurance" && (
                <>
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#495057]">
                        <FaIcon icon="fa-solid fa-shield-heart" className="text-[#3c8dbc]" />
                        Loại bảo hiểm (mã) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={openInsuranceTypeAddDialog}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#3c8dbc]/40 bg-[#3c8dbc]/10 text-[#2f7494] transition-colors hover:bg-[#3c8dbc]/20"
                        title="Thêm mã loại bảo hiểm mới"
                        aria-label="Thêm mã loại bảo hiểm mới"
                      >
                        <FaIcon icon="fa-solid fa-square-plus" className="text-lg" />
                      </button>
                    </div>
                    <p className="mb-1.5 flex items-start gap-1.5 text-xs text-[#6c757d]">
                      <FaIcon icon="fa-solid fa-lightbulb" className="mt-0.5 shrink-0 text-[#adb5bd]" />
                      <span>
                        Chọn từ gợi ý hoặc gõ mã tùy chỉnh (vd: BHXH, BHYT). Bấm (+) để thêm loại mới
                        vào danh sách.
                      </span>
                    </p>
                    <input
                      required
                      className="lte-input w-full"
                      list="admin-insurance-type-datalist"
                      value={form.insuranceType}
                      onChange={(e) => setForm((f) => ({ ...f, insuranceType: e.target.value }))}
                    />
                    <datalist id="admin-insurance-type-datalist">
                      {insuranceTypeSelectList.map((t) => (
                        <option key={t} value={t} label={insuranceTypeLabel(t)} />
                      ))}
                    </datalist>
                    {fieldErrors.insuranceType && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.insuranceType}</p>
                    )}
                  </div>
                  <TextField
                    label="Số hợp đồng / sổ"
                    labelIcon="fa-solid fa-hashtag"
                    value={form.policyNumber}
                    onChange={(v) => setForm((f) => ({ ...f, policyNumber: v }))}
                    error={fieldErrors.policyNumber}
                  />
                  <TextField
                    label="Nhà cung cấp"
                    labelIcon="fa-solid fa-hospital"
                    value={form.provider}
                    onChange={(v) => setForm((f) => ({ ...f, provider: v }))}
                    error={fieldErrors.provider}
                  />
                  <TextField
                    label="Ngày bắt đầu"
                    labelIcon="fa-solid fa-calendar-day"
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
                    error={fieldErrors.startDate}
                  />
                  <TextField
                    label="Ngày kết thúc"
                    labelIcon="fa-solid fa-calendar-xmark"
                    type="date"
                    value={form.endDate}
                    onChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
                    error={fieldErrors.endDate}
                  />
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#495057]">
                      <FaIcon icon="fa-solid fa-file-arrow-up" className="text-[#3c8dbc]" />
                      File đính kèm
                    </label>
                    <p className="mb-2 text-xs text-[#6c757d]">
                      PDF, ảnh scan hoặc Word — tối đa 10MB. Cần đăng nhập quản trị để upload.
                    </p>
                    <input
                      key={form.attachmentUrl || "no-ins-file"}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,application/pdf,image/*"
                      disabled={insuranceFileUploading}
                      className="lte-input w-full cursor-pointer text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#3c8dbc]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#2f7494]"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setInsuranceFileError(null);
                        setInsuranceFileUploading(true);
                        void uploadInsuranceDocument(f)
                          .then(({ url }) => {
                            setForm((prev) => ({ ...prev, attachmentUrl: url }));
                          })
                          .catch((err) => {
                            setInsuranceFileError(
                              err instanceof Error ? err.message : "Upload thất bại"
                            );
                          })
                          .finally(() => {
                            setInsuranceFileUploading(false);
                            e.target.value = "";
                          });
                      }}
                    />
                    {insuranceFileUploading && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-[#3c8dbc]">
                        <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                        Đang tải file lên…
                      </p>
                    )}
                    {insuranceFileError && (
                      <p className="mt-2 text-xs text-red-600">{insuranceFileError}</p>
                    )}
                    {fieldErrors.attachmentUrl && (
                      <p className="mt-2 text-xs text-red-600">{fieldErrors.attachmentUrl}</p>
                    )}
                    {form.attachmentUrl ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <a
                          href={backendPublicFileUrl(form.attachmentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lte-btn lte-btn-ghost lte-btn-sm border border-[#dee2e6] text-[#3c8dbc]"
                        >
                          <FaIcon icon="fa-solid fa-eye" />
                          Xem file hiện tại
                        </a>
                        <button
                          type="button"
                          className="lte-btn lte-btn-ghost lte-btn-sm text-[#6c757d]"
                          onClick={() => setForm((prev) => ({ ...prev, attachmentUrl: "" }))}
                        >
                          <FaIcon icon="fa-solid fa-xmark" />
                          Gỡ file
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              )}

              {kind === "laborContract" && (
                <>
                  <TextField
                    label="Số hợp đồng"
                    labelIcon="fa-solid fa-file-signature"
                    required
                    value={form.contractNumber}
                    onChange={(v) => setForm((f) => ({ ...f, contractNumber: v }))}
                    error={fieldErrors.contractNumber}
                  />
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#495057]">
                        <FaIcon icon="fa-solid fa-file-contract" className="text-[#3c8dbc]" />
                        Loại hợp đồng (mã)
                      </label>
                      <button
                        type="button"
                        onClick={openLaborContractTypeAddDialog}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#3c8dbc]/40 bg-[#3c8dbc]/10 text-[#2f7494] transition-colors hover:bg-[#3c8dbc]/20"
                        title="Thêm mã loại hợp đồng mới"
                        aria-label="Thêm mã loại hợp đồng mới"
                      >
                        <FaIcon icon="fa-solid fa-square-plus" className="text-lg" />
                      </button>
                    </div>
                    <p className="mb-1.5 flex items-start gap-1.5 text-xs text-[#6c757d]">
                      <FaIcon icon="fa-solid fa-lightbulb" className="mt-0.5 shrink-0 text-[#adb5bd]" />
                      <span>
                        Chọn từ gợi ý hoặc gõ mã tùy chỉnh (vd: HD_THU_VIEC). Bấm (+) để thêm loại mới
                        vào danh sách.
                      </span>
                    </p>
                    <input
                      className="lte-input w-full"
                      list="admin-labor-contract-type-datalist"
                      value={form.contractType}
                      onChange={(e) => setForm((f) => ({ ...f, contractType: e.target.value }))}
                    />
                    <datalist id="admin-labor-contract-type-datalist">
                      {laborContractTypeSelectList.map((t) => (
                        <option key={t} value={t} label={laborContractTypeLabel(t)} />
                      ))}
                    </datalist>
                    {fieldErrors.contractType && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.contractType}</p>
                    )}
                  </div>
                  <TextField
                    label="Ngày bắt đầu"
                    labelIcon="fa-solid fa-calendar-day"
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
                    error={fieldErrors.startDate}
                  />
                  <TextField
                    label="Ngày kết thúc"
                    labelIcon="fa-solid fa-calendar-xmark"
                    type="date"
                    value={form.endDate}
                    onChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
                    error={fieldErrors.endDate}
                  />
                  <TextField
                    label="Trạng thái"
                    labelIcon="fa-solid fa-signal"
                    value={form.status}
                    onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                    error={fieldErrors.status}
                  />
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#495057]">
                      <FaIcon icon="fa-solid fa-file-arrow-up" className="text-[#3c8dbc]" />
                      File đính kèm
                    </label>
                    <p className="mb-2 text-xs text-[#6c757d]">
                      PDF, ảnh scan hoặc Word — tối đa 10MB. Cần đăng nhập quản trị để upload.
                    </p>
                    <input
                      key={form.attachmentUrl || "no-labor-file"}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,application/pdf,image/*"
                      disabled={laborContractFileUploading}
                      className="lte-input w-full cursor-pointer text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#3c8dbc]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#2f7494]"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setLaborContractFileError(null);
                        setLaborContractFileUploading(true);
                        void uploadLaborContractDocument(f)
                          .then(({ url }) => {
                            setForm((prev) => ({ ...prev, attachmentUrl: url }));
                          })
                          .catch((err) => {
                            setLaborContractFileError(
                              err instanceof Error ? err.message : "Upload thất bại"
                            );
                          })
                          .finally(() => {
                            setLaborContractFileUploading(false);
                            e.target.value = "";
                          });
                      }}
                    />
                    {laborContractFileUploading && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-[#3c8dbc]">
                        <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                        Đang tải file lên…
                      </p>
                    )}
                    {laborContractFileError && (
                      <p className="mt-2 text-xs text-red-600">{laborContractFileError}</p>
                    )}
                    {fieldErrors.attachmentUrl && (
                      <p className="mt-2 text-xs text-red-600">{fieldErrors.attachmentUrl}</p>
                    )}
                    {form.attachmentUrl ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <a
                          href={backendPublicFileUrl(form.attachmentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lte-btn lte-btn-ghost lte-btn-sm border border-[#dee2e6] text-[#3c8dbc]"
                        >
                          <FaIcon icon="fa-solid fa-eye" />
                          Xem file hiện tại
                        </a>
                        <button
                          type="button"
                          className="lte-btn lte-btn-ghost lte-btn-sm text-[#6c757d]"
                          onClick={() => setForm((prev) => ({ ...prev, attachmentUrl: "" }))}
                        >
                          <FaIcon icon="fa-solid fa-xmark" />
                          Gỡ file
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              )}

              {kind === "researchWork" && (
                <>
                  <TextField
                    label="Tiêu đề"
                    labelIcon="fa-solid fa-heading"
                    required
                    value={form.title}
                    onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                    error={fieldErrors.title}
                  />
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#495057]">
                        <FaIcon icon="fa-solid fa-bookmark" className="text-[#3c8dbc]" />
                        Loại công trình (mã)
                      </label>
                      <button
                        type="button"
                        onClick={openResearchWorkTypeAddDialog}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#3c8dbc]/40 bg-[#3c8dbc]/10 text-[#2f7494] transition-colors hover:bg-[#3c8dbc]/20"
                        title="Thêm mã loại công trình mới"
                        aria-label="Thêm mã loại công trình mới"
                      >
                        <FaIcon icon="fa-solid fa-square-plus" className="text-lg" />
                      </button>
                    </div>
                    <p className="mb-1.5 flex items-start gap-1.5 text-xs text-[#6c757d]">
                      <FaIcon icon="fa-solid fa-lightbulb" className="mt-0.5 shrink-0 text-[#adb5bd]" />
                      <span>
                        Chọn từ gợi ý hoặc gõ mã tùy chỉnh (vd: BAI_BAO). Bấm (+) để thêm loại mới vào
                        danh sách.
                      </span>
                    </p>
                    <input
                      className="lte-input w-full"
                      list="admin-research-work-type-datalist"
                      value={form.workType}
                      onChange={(e) => setForm((f) => ({ ...f, workType: e.target.value }))}
                    />
                    <datalist id="admin-research-work-type-datalist">
                      {researchWorkTypeSelectList.map((t) => (
                        <option key={t} value={t} label={researchWorkTypeLabel(t)} />
                      ))}
                    </datalist>
                    {fieldErrors.workType && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.workType}</p>
                    )}
                  </div>
                  <TextField
                    label="Năm xuất bản"
                    labelIcon="fa-solid fa-calendar"
                    value={form.publicationYear}
                    onChange={(v) => setForm((f) => ({ ...f, publicationYear: v }))}
                    error={fieldErrors.publicationYear}
                  />
                  <TextField
                    label="Nơi công bố / tạp chí"
                    labelIcon="fa-solid fa-newspaper"
                    value={form.venue}
                    onChange={(v) => setForm((f) => ({ ...f, venue: v }))}
                    error={fieldErrors.venue}
                  />
                  <TextField
                    label="Vai trò tác giả"
                    labelIcon="fa-solid fa-user-pen"
                    value={form.authorRole}
                    onChange={(v) => setForm((f) => ({ ...f, authorRole: v }))}
                    error={fieldErrors.authorRole}
                  />
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#495057]">
                      <FaIcon icon="fa-solid fa-file-arrow-up" className="text-[#3c8dbc]" />
                      File đính kèm
                    </label>
                    <p className="mb-2 text-xs text-[#6c757d]">
                      PDF, ảnh scan hoặc Word — tối đa 10MB. Cần đăng nhập quản trị để upload.
                    </p>
                    <input
                      key={form.attachmentUrl || "no-rw-file"}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,application/pdf,image/*"
                      disabled={researchWorkFileUploading}
                      className="lte-input w-full cursor-pointer text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#3c8dbc]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#2f7494]"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setResearchWorkFileError(null);
                        setResearchWorkFileUploading(true);
                        void uploadResearchWorkDocument(f)
                          .then(({ url }) => {
                            setForm((prev) => ({ ...prev, attachmentUrl: url }));
                          })
                          .catch((err) => {
                            setResearchWorkFileError(
                              err instanceof Error ? err.message : "Upload thất bại"
                            );
                          })
                          .finally(() => {
                            setResearchWorkFileUploading(false);
                            e.target.value = "";
                          });
                      }}
                    />
                    {researchWorkFileUploading && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-[#3c8dbc]">
                        <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                        Đang tải file lên…
                      </p>
                    )}
                    {researchWorkFileError && (
                      <p className="mt-2 text-xs text-red-600">{researchWorkFileError}</p>
                    )}
                    {fieldErrors.attachmentUrl && (
                      <p className="mt-2 text-xs text-red-600">{fieldErrors.attachmentUrl}</p>
                    )}
                    {form.attachmentUrl ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <a
                          href={backendPublicFileUrl(form.attachmentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lte-btn lte-btn-ghost lte-btn-sm border border-[#dee2e6] text-[#3c8dbc]"
                        >
                          <FaIcon icon="fa-solid fa-eye" />
                          Xem file hiện tại
                        </a>
                        <button
                          type="button"
                          className="lte-btn lte-btn-ghost lte-btn-sm text-[#6c757d]"
                          onClick={() => setForm((prev) => ({ ...prev, attachmentUrl: "" }))}
                        >
                          <FaIcon icon="fa-solid fa-xmark" />
                          Gỡ file
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#495057]">
                  <FaIcon icon="fa-solid fa-note-sticky" className="text-[#3c8dbc]" />
                  Ghi chú
                </label>
                <textarea
                  className="lte-input min-h-[72px] w-full resize-y"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
                {fieldErrors.notes && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.notes}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-[#eef2f6] pt-4">
                <button type="button" onClick={closeModal} className="lte-btn lte-btn-ghost lte-btn-sm">
                  <FaIcon icon="fa-solid fa-ban" />
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="lte-btn lte-btn-primary lte-btn-sm"
                >
                  {saving ? (
                    <>
                      <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                      Đang lưu…
                    </>
                  ) : (
                    <>
                      <FaIcon icon="fa-solid fa-floppy-disk" />
                      Lưu
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {kind === "credential" && categoryAddModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
          role="presentation"
          onClick={() => {
            setCategoryAddModalOpen(false);
            setNewCategoryError(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#e8ecf0] bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cred-cat-add-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h5
                id="cred-cat-add-title"
                className="flex items-center gap-2 text-base font-semibold text-[#2c3e50]"
              >
                <FaIcon icon="fa-solid fa-square-plus" className="text-[#3c8dbc]" />
                Thêm mã loại chứng chỉ
              </h5>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6c757d] hover:bg-[#f1f3f5]"
                aria-label="Đóng"
                onClick={() => {
                  setCategoryAddModalOpen(false);
                  setNewCategoryError(null);
                }}
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-lg" />
              </button>
            </div>
            <p className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-[#6c757d]">
              <FaIcon icon="fa-solid fa-circle-info" className="mt-0.5 shrink-0 text-[#3c8dbc]" />
              <span>
                Mã dùng để lọc và lưu (VD: CHUNG_CHI, NGHIEP_VU). Khoảng trắng sẽ được thay bằng dấu
                gạch dưới. Tối đa 50 ký tự.
              </span>
            </p>
            <input
              className="lte-input w-full font-mono text-sm"
              value={newCategoryInput}
              onChange={(e) => {
                setNewCategoryInput(e.target.value);
                setNewCategoryError(null);
              }}
              placeholder="Nhập mã loại…"
              maxLength={50}
              autoFocus
            />
            {newCategoryError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <FaIcon icon="fa-solid fa-circle-exclamation" />
                {newCategoryError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2 border-t border-[#eef2f6] pt-4">
              <button
                type="button"
                className="lte-btn lte-btn-ghost lte-btn-sm"
                onClick={() => {
                  setCategoryAddModalOpen(false);
                  setNewCategoryError(null);
                }}
              >
                <FaIcon icon="fa-solid fa-ban" />
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmAddCredentialCategory}
                className="lte-btn lte-btn-primary lte-btn-sm"
              >
                <FaIcon icon="fa-solid fa-check" />
                Thêm loại
              </button>
            </div>
          </div>
        </div>
      )}

      {kind === "insurance" && insuranceTypeAddModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
          role="presentation"
          onClick={() => {
            setInsuranceTypeAddModalOpen(false);
            setNewInsuranceTypeError(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#e8ecf0] bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ins-type-add-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h5
                id="ins-type-add-title"
                className="flex items-center gap-2 text-base font-semibold text-[#2c3e50]"
              >
                <FaIcon icon="fa-solid fa-square-plus" className="text-[#3c8dbc]" />
                Thêm mã loại bảo hiểm
              </h5>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6c757d] hover:bg-[#f1f3f5]"
                aria-label="Đóng"
                onClick={() => {
                  setInsuranceTypeAddModalOpen(false);
                  setNewInsuranceTypeError(null);
                }}
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-lg" />
              </button>
            </div>
            <p className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-[#6c757d]">
              <FaIcon icon="fa-solid fa-circle-info" className="mt-0.5 shrink-0 text-[#3c8dbc]" />
              <span>
                Mã dùng để lọc và lưu (VD: BHXH, BHTN_TU_NGUYEN). Khoảng trắng sẽ được thay bằng dấu
                gạch dưới. Tối đa 100 ký tự.
              </span>
            </p>
            <input
              className="lte-input w-full font-mono text-sm"
              value={newInsuranceTypeInput}
              onChange={(e) => {
                setNewInsuranceTypeInput(e.target.value);
                setNewInsuranceTypeError(null);
              }}
              placeholder="Nhập mã loại…"
              maxLength={100}
              autoFocus
            />
            {newInsuranceTypeError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <FaIcon icon="fa-solid fa-circle-exclamation" />
                {newInsuranceTypeError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2 border-t border-[#eef2f6] pt-4">
              <button
                type="button"
                className="lte-btn lte-btn-ghost lte-btn-sm"
                onClick={() => {
                  setInsuranceTypeAddModalOpen(false);
                  setNewInsuranceTypeError(null);
                }}
              >
                <FaIcon icon="fa-solid fa-ban" />
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmAddInsuranceType}
                className="lte-btn lte-btn-primary lte-btn-sm"
              >
                <FaIcon icon="fa-solid fa-check" />
                Thêm loại
              </button>
            </div>
          </div>
        </div>
      )}

      {kind === "laborContract" && laborContractTypeAddModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
          role="presentation"
          onClick={() => {
            setLaborContractTypeAddModalOpen(false);
            setNewLaborContractTypeError(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#e8ecf0] bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="labor-contract-type-add-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h5
                id="labor-contract-type-add-title"
                className="flex items-center gap-2 text-base font-semibold text-[#2c3e50]"
              >
                <FaIcon icon="fa-solid fa-square-plus" className="text-[#3c8dbc]" />
                Thêm mã loại hợp đồng
              </h5>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6c757d] hover:bg-[#f1f3f5]"
                aria-label="Đóng"
                onClick={() => {
                  setLaborContractTypeAddModalOpen(false);
                  setNewLaborContractTypeError(null);
                }}
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-lg" />
              </button>
            </div>
            <p className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-[#6c757d]">
              <FaIcon icon="fa-solid fa-circle-info" className="mt-0.5 shrink-0 text-[#3c8dbc]" />
              <span>
                Mã dùng để lọc và lưu (VD: HD_THU_VIEC, HD_XAC_DINH_12T). Khoảng trắng sẽ được thay
                bằng dấu gạch dưới. Tối đa 100 ký tự.
              </span>
            </p>
            <input
              className="lte-input w-full font-mono text-sm"
              value={newLaborContractTypeInput}
              onChange={(e) => {
                setNewLaborContractTypeInput(e.target.value);
                setNewLaborContractTypeError(null);
              }}
              placeholder="Nhập mã loại…"
              maxLength={100}
              autoFocus
            />
            {newLaborContractTypeError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <FaIcon icon="fa-solid fa-circle-exclamation" />
                {newLaborContractTypeError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2 border-t border-[#eef2f6] pt-4">
              <button
                type="button"
                className="lte-btn lte-btn-ghost lte-btn-sm"
                onClick={() => {
                  setLaborContractTypeAddModalOpen(false);
                  setNewLaborContractTypeError(null);
                }}
              >
                <FaIcon icon="fa-solid fa-ban" />
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmAddLaborContractType}
                className="lte-btn lte-btn-primary lte-btn-sm"
              >
                <FaIcon icon="fa-solid fa-check" />
                Thêm loại
              </button>
            </div>
          </div>
        </div>
      )}

      {kind === "researchWork" && researchWorkTypeAddModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
          role="presentation"
          onClick={() => {
            setResearchWorkTypeAddModalOpen(false);
            setNewResearchWorkTypeError(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#e8ecf0] bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rw-type-add-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h5
                id="rw-type-add-title"
                className="flex items-center gap-2 text-base font-semibold text-[#2c3e50]"
              >
                <FaIcon icon="fa-solid fa-square-plus" className="text-[#3c8dbc]" />
                Thêm mã loại công trình
              </h5>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6c757d] hover:bg-[#f1f3f5]"
                aria-label="Đóng"
                onClick={() => {
                  setResearchWorkTypeAddModalOpen(false);
                  setNewResearchWorkTypeError(null);
                }}
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-lg" />
              </button>
            </div>
            <p className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-[#6c757d]">
              <FaIcon icon="fa-solid fa-circle-info" className="mt-0.5 shrink-0 text-[#3c8dbc]" />
              <span>
                Mã dùng để lọc và lưu (VD: BAI_BAO, DE_TAI_CAP_BO). Khoảng trắng sẽ được thay bằng dấu
                gạch dưới. Tối đa 100 ký tự.
              </span>
            </p>
            <input
              className="lte-input w-full font-mono text-sm"
              value={newResearchWorkTypeInput}
              onChange={(e) => {
                setNewResearchWorkTypeInput(e.target.value);
                setNewResearchWorkTypeError(null);
              }}
              placeholder="Nhập mã loại…"
              maxLength={100}
              autoFocus
            />
            {newResearchWorkTypeError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <FaIcon icon="fa-solid fa-circle-exclamation" />
                {newResearchWorkTypeError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2 border-t border-[#eef2f6] pt-4">
              <button
                type="button"
                className="lte-btn lte-btn-ghost lte-btn-sm"
                onClick={() => {
                  setResearchWorkTypeAddModalOpen(false);
                  setNewResearchWorkTypeError(null);
                }}
              >
                <FaIcon icon="fa-solid fa-ban" />
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmAddResearchWorkType}
                className="lte-btn lte-btn-primary lte-btn-sm"
              >
                <FaIcon icon="fa-solid fa-check" />
                Thêm loại
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TextField({
  label,
  labelIcon,
  value,
  onChange,
  error,
  required,
  type = "text",
}: {
  label: string;
  labelIcon?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#495057]">
        {labelIcon && (
          <FaIcon icon={labelIcon} className="shrink-0 text-[#3c8dbc] opacity-90" />
        )}
        <span>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
      </label>
      <input
        type={type}
        required={required}
        className="lte-input w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
          <FaIcon icon="fa-solid fa-circle-xmark" className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
