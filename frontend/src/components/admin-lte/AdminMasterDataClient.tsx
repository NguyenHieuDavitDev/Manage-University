"use client";

import { FaIcon } from "@/components/FaIcon";
import {
  createAcademicRank,
  deleteAcademicRank,
  fetchAcademicRankPage,
  updateAcademicRank,
} from "@/lib/api/academicRanks";
import {
  createBuilding,
  deleteBuilding,
  fetchBuildingPage,
  updateBuilding,
} from "@/lib/api/buildings";
import {
  createCourse,
  deleteCourse,
  fetchCoursePage,
  updateCourse,
} from "@/lib/api/courses";
import {
  createDepartment,
  deleteDepartment,
  fetchDepartmentPage,
  updateDepartment,
} from "@/lib/api/departments";
import { createFaculty, deleteFaculty, fetchFacultyPage, updateFaculty } from "@/lib/api/faculties";
import {
  createPosition,
  deletePosition,
  fetchPositionCategories,
  fetchPositionPage,
  updatePosition,
} from "@/lib/api/positions";
import type { ApiErrorBody } from "@/lib/types/common";
import type {
  AcademicRank,
  AcademicRankPayload,
  Building,
  BuildingPayload,
  Course,
  CoursePayload,
  Department,
  DepartmentPayload,
  Faculty,
  FacultyPayload,
  Position,
  PositionPayload,
  SpringPage,
} from "@/lib/types/hrEntities";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

export type MasterDataKind =
  | "academicRank"
  | "faculty"
  | "building"
  | "course"
  | "department"
  | "position";

type FormState = {
  code: string;
  name: string;
  description: string;
  positionCategory: string;
  /** Chỉ dùng khi kind === "course" — số tín chỉ */
  credits: string;
};

const DEFAULT_POSITION_CATEGORIES = ["QUAN_LY", "GIANG_DAY", "HANH_CHINH", "HO_TRO"] as const;

const POSITION_CATEGORY_LABELS: Record<string, string> = {
  QUAN_LY: "Quản lý",
  GIANG_DAY: "Giảng dạy",
  HANH_CHINH: "Hành chính",
  HO_TRO: "Hỗ trợ / nghiệp vụ",
};

function positionCategoryLabel(code: string): string {
  return POSITION_CATEGORY_LABELS[code] ?? code;
}

function mergePositionCategoryOptions(fromApi: string[]): string[] {
  const set = new Set<string>();
  for (const d of DEFAULT_POSITION_CATEGORIES) set.add(d);
  for (const c of fromApi) {
    const t = c?.trim();
    if (t) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
}

type LoadedState =
  | { kind: "academicRank"; page: SpringPage<AcademicRank> }
  | { kind: "faculty"; page: SpringPage<Faculty> }
  | { kind: "building"; page: SpringPage<Building> }
  | { kind: "course"; page: SpringPage<Course> }
  | { kind: "department"; page: SpringPage<Department> }
  | { kind: "position"; page: SpringPage<Position> };

const META: Record<
  MasterDataKind,
  {
    title: string;
    crumb: string;
    titleIcon: string;
    listTitle: string;
    codeLabel: string;
    nameLabel: string;
    sort: string;
    emptyHint: string;
  }
> = {
  academicRank: {
    title: "Học hàm / học vị",
    crumb: "Học hàm",
    titleIcon: "fa-solid fa-award",
    listTitle: "Danh sách học hàm",
    codeLabel: "Mã",
    nameLabel: "Tên",
    sort: "id",
    emptyHint: "Thử từ khóa khác hoặc thêm học hàm mới.",
  },
  faculty: {
    title: "Khoa / đơn vị",
    crumb: "Khoa",
    titleIcon: "fa-solid fa-building-columns",
    listTitle: "Danh sách khoa",
    codeLabel: "Mã khoa",
    nameLabel: "Tên khoa",
    sort: "id",
    emptyHint: "Thử từ khóa khác hoặc thêm khoa mới.",
  },
  building: {
    title: "Quản lý tòa nhà",
    crumb: "Tòa nhà",
    titleIcon: "fa-solid fa-building",
    listTitle: "Danh sách tòa nhà",
    codeLabel: "Mã tòa nhà",
    nameLabel: "Tên tòa nhà",
    sort: "id",
    emptyHint: "Thử từ khóa khác hoặc thêm tòa nhà mới.",
  },
  course: {
    title: "Học phần",
    crumb: "Học phần",
    titleIcon: "fa-solid fa-book",
    listTitle: "Danh sách học phần",
    codeLabel: "Mã học phần",
    nameLabel: "Tên học phần",
    sort: "id",
    emptyHint: "Thử từ khóa khác hoặc thêm học phần mới.",
  },
  department: {
    title: "Phòng ban",
    crumb: "Phòng ban",
    titleIcon: "fa-solid fa-sitemap",
    listTitle: "Danh sách phòng ban",
    codeLabel: "Mã phòng ban",
    nameLabel: "Tên phòng ban",
    sort: "id",
    emptyHint: "Thử từ khóa khác hoặc thêm phòng ban mới.",
  },
  position: {
    title: "Chức vụ",
    crumb: "Chức vụ",
    titleIcon: "fa-solid fa-briefcase",
    listTitle: "Danh sách chức vụ",
    codeLabel: "Mã chức vụ",
    nameLabel: "Tên chức vụ",
    sort: "id,desc",
    emptyHint: "Thử từ khóa / nhóm khác hoặc thêm chức vụ mới.",
  },
};

export default function AdminMasterDataClient({ kind }: { kind: MasterDataKind }) {
  const m = META[kind];
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const qParam = (searchParams.get("q") || "").trim();
  const positionCategoryParam =
    kind === "position" ? (searchParams.get("positionCategory") || "").trim() : "";

  const [draft, setDraft] = useState(qParam);
  const [loaded, setLoaded] = useState<LoadedState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    code: "",
    name: "",
    description: "",
    positionCategory: "",
    credits: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [positionCategoryOptions, setPositionCategoryOptions] = useState<string[]>([]);
  const [extraPositionCategories, setExtraPositionCategories] = useState<string[]>([]);
  const [positionCategoryAddOpen, setPositionCategoryAddOpen] = useState(false);
  const [newPositionCategoryInput, setNewPositionCategoryInput] = useState("");
  const [newPositionCategoryError, setNewPositionCategoryError] = useState<string | null>(null);

  const mergedPositionCategoryOptions = useMemo(
    () => mergePositionCategoryOptions([...positionCategoryOptions, ...extraPositionCategories]),
    [positionCategoryOptions, extraPositionCategories]
  );

  const positionCategorySelectList = useMemo(() => {
    if (kind !== "position") return [];
    const opts = [...mergedPositionCategoryOptions];
    const cur = form.positionCategory.trim();
    if (cur && !opts.some((x) => x.toLowerCase() === cur.toLowerCase())) {
      opts.push(cur);
      opts.sort((a, b) => a.localeCompare(b, "vi"));
    }
    return opts;
  }, [kind, mergedPositionCategoryOptions, form.positionCategory]);

  useEffect(() => {
    if (kind !== "position") return;
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchPositionCategories();
        if (!cancelled) setPositionCategoryOptions(list);
      } catch {
        if (!cancelled) setPositionCategoryOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  useEffect(() => {
    setDraft(qParam);
  }, [qParam]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (kind === "academicRank") {
        const pageData = await fetchAcademicRankPage(page, 10, m.sort, qParam || undefined);
        setLoaded({ kind: "academicRank", page: pageData });
      } else if (kind === "faculty") {
        const pageData = await fetchFacultyPage(page, 10, m.sort, qParam || undefined);
        setLoaded({ kind: "faculty", page: pageData });
      } else if (kind === "building") {
        const pageData = await fetchBuildingPage(page, 10, m.sort, qParam || undefined);
        setLoaded({ kind: "building", page: pageData });
      } else if (kind === "department") {
        const pageData = await fetchDepartmentPage(page, 10, m.sort, qParam || undefined);
        setLoaded({ kind: "department", page: pageData });
      } else if (kind === "course") {
        const pageData = await fetchCoursePage(page, 10, m.sort, qParam || undefined);
        setLoaded({ kind: "course", page: pageData });
      } else {
        const pageData = await fetchPositionPage(
          page,
          10,
          m.sort,
          qParam || undefined,
          positionCategoryParam || undefined
        );
        setLoaded({ kind: "position", page: pageData });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
      setLoaded(null);
    } finally {
      setLoading(false);
    }
  }, [kind, m.sort, page, positionCategoryParam, qParam]);

  useEffect(() => {
    void load();
  }, [load]);

  function pushQuery(nextPage: number, nextQ: string, positionCategoryUpdate?: string | null) {
    const p = new URLSearchParams();
    p.set("page", String(nextPage));
    const t = nextQ.trim();
    if (t) p.set("q", t);
    if (kind === "position") {
      let cat: string;
      if (positionCategoryUpdate === undefined) {
        cat = (searchParams.get("positionCategory") || "").trim();
      } else if (positionCategoryUpdate === null) {
        cat = "";
      } else {
        cat = positionCategoryUpdate.trim();
      }
      if (cat) p.set("positionCategory", cat);
    }
    router.push(`?${p.toString()}`);
  }

  function setPage(p: number) {
    pushQuery(p, qParam);
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    pushQuery(0, draft);
  }

  function clearSearch() {
    setDraft("");
    pushQuery(0, "", null);
  }

  function emptyForm(): FormState {
    return { code: "", name: "", description: "", positionCategory: "", credits: "" };
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      positionCategory: kind === "position" ? positionCategoryParam : "",
    });
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(id: number) {
    if (!loaded || loaded.kind !== kind) return;
    const row = loaded.page.content.find((x) => x.id === id);
    if (!row) return;
    if (kind === "academicRank") {
      const r = row as AcademicRank;
      setForm({
        code: r.rankCode,
        name: r.rankName,
        description: r.description ?? "",
        positionCategory: "",
        credits: "",
      });
    } else if (kind === "faculty") {
      const r = row as Faculty;
      setForm({
        code: r.facultyCode,
        name: r.facultyName,
        description: r.description ?? "",
        positionCategory: "",
        credits: "",
      });
    } else if (kind === "building") {
      const r = row as Building;
      setForm({
        code: r.buildingCode,
        name: r.buildingName,
        description: r.description ?? "",
        positionCategory: "",
        credits: "",
      });
    } else if (kind === "department") {
      const r = row as Department;
      setForm({
        code: r.departmentCode,
        name: r.departmentName,
        description: r.description ?? "",
        positionCategory: "",
        credits: "",
      });
    } else if (kind === "course") {
      const r = row as Course;
      setForm({
        code: r.courseCode,
        name: r.courseName,
        description: r.description ?? "",
        positionCategory: "",
        credits: String(r.credits),
      });
    } else {
      const r = row as Position;
      setForm({
        code: r.positionCode,
        name: r.positionName,
        description: r.description ?? "",
        positionCategory: r.positionCategory ?? "",
        credits: "",
      });
    }
    setEditingId(id);
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function openPositionCategoryAddDialog() {
    setNewPositionCategoryInput("");
    setNewPositionCategoryError(null);
    setPositionCategoryAddOpen(true);
  }

  function confirmAddPositionCategory() {
    const raw = newPositionCategoryInput.trim().replace(/\s+/g, "_");
    const code = raw.length > 0 ? raw : "";
    if (!code) {
      setNewPositionCategoryError("Nhập mã nhóm (vd: GIANG_DAY, PHO_KHOA).");
      return;
    }
    if (code.length > 100) {
      setNewPositionCategoryError("Mã nhóm tối đa 100 ký tự.");
      return;
    }
    const existing = mergePositionCategoryOptions([
      ...positionCategoryOptions,
      ...extraPositionCategories,
    ]);
    if (existing.some((c) => c.toLowerCase() === code.toLowerCase())) {
      setNewPositionCategoryError("Mã nhóm này đã có trong danh sách.");
      return;
    }
    setExtraPositionCategories((prev) => [...prev, code]);
    if (kind === "position" && modalOpen) {
      setForm((f) => ({ ...f, positionCategory: code }));
    } else if (kind === "position") {
      pushQuery(0, qParam, code);
    }
    setPositionCategoryAddOpen(false);
    setNewPositionCategoryInput("");
    setNewPositionCategoryError(null);
  }

  function openCreateWithPositionCategory(cat: string) {
    setEditingId(null);
    setForm({ ...emptyForm(), positionCategory: cat });
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSaving(true);
    const desc = form.description.trim() || undefined;
    try {
      if (kind === "academicRank") {
        const payload: AcademicRankPayload = {
          rankCode: form.code.trim(),
          rankName: form.name.trim(),
          description: desc,
        };
        if (editingId == null) await createAcademicRank(payload);
        else await updateAcademicRank(editingId, payload);
      } else if (kind === "faculty") {
        const payload: FacultyPayload = {
          facultyCode: form.code.trim(),
          facultyName: form.name.trim(),
          description: desc,
        };
        if (editingId == null) await createFaculty(payload);
        else await updateFaculty(editingId, payload);
      } else if (kind === "building") {
        const payload: BuildingPayload = {
          buildingName: form.name.trim(),
          description: desc,
        };
        if (editingId == null) await createBuilding(payload);
        else await updateBuilding(editingId, payload);
      } else if (kind === "department") {
        const payload: DepartmentPayload = {
          departmentCode: form.code.trim(),
          departmentName: form.name.trim(),
          description: desc,
        };
        if (editingId == null) await createDepartment(payload);
        else await updateDepartment(editingId, payload);
      } else if (kind === "course") {
        const creditsNum = Number(form.credits.trim());
        if (!Number.isFinite(creditsNum) || !Number.isInteger(creditsNum) || creditsNum < 1) {
          setFieldErrors({ credits: "Nhập số tín chỉ nguyên dương (1–50)." });
          return;
        }
        if (creditsNum > 50) {
          setFieldErrors({ credits: "Số tín chỉ tối đa 50." });
          return;
        }
        const payload: CoursePayload = {
          courseCode: form.code.trim(),
          courseName: form.name.trim(),
          credits: creditsNum,
          description: desc,
        };
        if (editingId == null) await createCourse(payload);
        else await updateCourse(editingId, payload);
      } else {
        const cat = form.positionCategory.trim();
        const payload: PositionPayload = {
          positionCode: form.code.trim(),
          positionName: form.name.trim(),
          positionCategory: cat || undefined,
          description: desc,
        };
        if (editingId == null) await createPosition(payload);
        else await updatePosition(editingId, payload);
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
      if (kind === "academicRank") await deleteAcademicRank(id);
      else if (kind === "faculty") await deleteFaculty(id);
      else if (kind === "building") await deleteBuilding(id);
      else if (kind === "department") await deleteDepartment(id);
      else if (kind === "course") await deleteCourse(id);
      else await deletePosition(id);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function rowCells(row: AcademicRank | Faculty | Building | Course | Department | Position) {
    if (kind === "academicRank") {
      const r = row as AcademicRank;
      return {
        code: r.rankCode,
        name: r.rankName,
        desc: r.description,
        category: null as string | null,
        credits: null as number | null,
      };
    }
    if (kind === "faculty") {
      const r = row as Faculty;
      return {
        code: r.facultyCode,
        name: r.facultyName,
        desc: r.description,
        category: null as string | null,
        credits: null as number | null,
      };
    }
    if (kind === "building") {
      const r = row as Building;
      return {
        code: r.buildingCode,
        name: r.buildingName,
        desc: r.description,
        category: null as string | null,
        credits: null as number | null,
      };
    }
    if (kind === "course") {
      const r = row as Course;
      return {
        code: r.courseCode,
        name: r.courseName,
        desc: r.description,
        category: null as string | null,
        credits: r.credits,
      };
    }
    if (kind === "department") {
      const r = row as Department;
      return {
        code: r.departmentCode,
        name: r.departmentName,
        desc: r.description,
        category: null as string | null,
        credits: null as number | null,
      };
    }
    const r = row as Position;
    return {
      code: r.positionCode,
      name: r.positionName,
      desc: r.description,
      category: r.positionCategory,
      credits: null as number | null,
    };
  }

  const data = loaded && loaded.kind === kind ? loaded.page : null;
  const tableColCount = kind === "position" || kind === "course" ? 5 : 4;
  const hasActiveFilters = Boolean(qParam) || (kind === "position" && Boolean(positionCategoryParam));

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
          kind === "position" && positionCategoryParam ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => openCreateWithPositionCategory(positionCategoryParam)}
                className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
              >
                <FaIcon icon="fa-solid fa-plus" />
                Thêm &quot;{positionCategoryLabel(positionCategoryParam)}&quot;
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="lte-btn lte-btn-ghost lte-btn-sm border border-[#dee2e6]"
              >
                <FaIcon icon="fa-solid fa-list-ul" />
                Thêm nhóm khác…
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
        {kind === "position" && (
          <div className="mb-4 rounded-xl border border-[#e3e8ec] bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#495057]">
                <FaIcon icon="fa-solid fa-layer-group" className="text-[#3c8dbc]" />
                <span>Chọn nhóm chức vụ</span>
                <button
                  type="button"
                  onClick={openPositionCategoryAddDialog}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#3c8dbc]/35 bg-[#3c8dbc]/8 text-[#2f7494] transition-colors hover:bg-[#3c8dbc]/15"
                  title="Thêm mã nhóm mới"
                  aria-label="Thêm mã nhóm mới"
                >
                  <FaIcon icon="fa-solid fa-square-plus" className="text-base" />
                </button>
              </div>
              {positionCategoryParam ? (
                <button
                  type="button"
                  onClick={() => openCreateWithPositionCategory(positionCategoryParam)}
                  className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
                >
                  <FaIcon icon="fa-solid fa-plus" />
                  Thêm chức vụ ({positionCategoryLabel(positionCategoryParam)})
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => pushQuery(0, qParam, null)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  !positionCategoryParam
                    ? "border-[#3c8dbc] bg-[#3c8dbc]/12 text-[#2f7494]"
                    : "border-[#dee2e6] bg-[#f8fafc] text-[#5a6c7d] hover:border-[#3c8dbc]/40"
                }`}
              >
                <FaIcon icon="fa-solid fa-border-all" />
                Tất cả nhóm
              </button>
              {mergedPositionCategoryOptions.map((cat) => {
                const active = positionCategoryParam === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => pushQuery(0, qParam, cat)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-[#3c8dbc] bg-[#3c8dbc]/12 text-[#2f7494]"
                        : "border-[#dee2e6] bg-[#f8fafc] text-[#5a6c7d] hover:border-[#3c8dbc]/40"
                    }`}
                  >
                    <FaIcon icon="fa-solid fa-tag" className="opacity-80" />
                    <span className="mr-1">{positionCategoryLabel(cat)}</span>
                    <span className="font-mono text-[10px] opacity-80">({cat})</span>
                  </button>
                );
              })}
            </div>
            {positionCategoryParam ? (
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[#6c757d]">
                <FaIcon icon="fa-solid fa-filter" className="mt-0.5 shrink-0 text-[#3c8dbc]" />
                <span>
                  Đang lọc theo nhóm{" "}
                  <strong className="text-[#495057]">{positionCategoryLabel(positionCategoryParam)}</strong>.
                </span>
              </p>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-xs text-[#6c757d]">
                <FaIcon icon="fa-solid fa-hand-pointer" className="mt-0.5 shrink-0 text-[#adb5bd]" />
                <span>Bấm một nhóm để xem chức vụ thuộc nhóm đó.</span>
              </p>
            )}
          </div>
        )}

        <form
          onSubmit={applySearch}
          className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            name="q"
            className="lte-input min-w-0 flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              kind === "position"
                ? "Tìm theo mã, tên, nhóm hoặc mô tả…"
                : "Tìm theo mã, tên hoặc mô tả…"
            }
          />
          <div className="flex shrink-0 gap-2">
            <button type="submit" className="lte-btn lte-btn-primary lte-btn-sm">
              <FaIcon icon="fa-solid fa-magnifying-glass" />
              Tìm kiếm
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearSearch}
                className="lte-btn lte-btn-ghost lte-btn-sm"
              >
                <FaIcon icon="fa-solid fa-xmark" />
                Xóa lọc
              </button>
            )}
          </div>
        </form>

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
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">{m.codeLabel}</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">{m.nameLabel}</th>
                    {kind === "position" && (
                      <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Nhóm chức vụ</th>
                    )}
                    {kind === "course" && (
                      <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Tín chỉ</th>
                    )}
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Mô tả</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 text-right font-semibold">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.length === 0 && (
                    <tr>
                      <td colSpan={tableColCount} className="px-4 py-14 text-center text-[#6c757d]">
                        <FaIcon icon="fa-solid fa-filter-circle-xmark" className="mb-2 text-4xl" />
                        <p className="text-sm font-medium text-[#495057]">Không có dữ liệu</p>
                        <p className="text-xs">{m.emptyHint}</p>
                      </td>
                    </tr>
                  )}
                  {data.content.map((row) => {
                    const { code, name, desc, category, credits } = rowCells(row);
                    return (
                      <tr key={row.id} className="border-b border-[#f0f3f6] last:border-0">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-[#495057]">
                          {code}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#2c3e50]">{name}</td>
                        {kind === "position" && (
                          <td className="px-4 py-3 text-[#495057]">
                            {category ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#dee2e6] bg-[#f8fafc] px-2 py-0.5 text-xs font-medium">
                                {positionCategoryLabel(category)}
                                <span className="font-mono text-[10px] text-[#6c757d]">({category})</span>
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        )}
                        {kind === "course" && (
                          <td className="px-4 py-3 tabular-nums text-[#495057]">{credits ?? "—"}</td>
                        )}
                        <td className="max-w-xs truncate px-4 py-3 text-[#6c757d]">
                          {desc || "—"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEdit(row.id)}
                            className="lte-btn lte-btn-ghost lte-btn-sm mr-1 border-transparent text-[#3c8dbc] hover:bg-[#3c8dbc]/10"
                          >
                            <FaIcon icon="fa-solid fa-pen-to-square" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(row.id)}
                            className="lte-btn lte-btn-danger lte-btn-sm"
                          >
                            <FaIcon icon="fa-solid fa-trash-can" />
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data.totalPages > 1 && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f6] pt-4 text-sm text-[#6c757d]">
                <span>
                  Trang {data.number + 1}/{data.totalPages} — {data.totalElements} bản ghi
                  {qParam && (
                    <span className="ml-2 rounded-full bg-[#3c8dbc]/10 px-2 py-0.5 text-xs text-[#3c8dbc]">
                      Lọc: &quot;{qParam}&quot;
                    </span>
                  )}
                  {kind === "position" && positionCategoryParam && (
                    <span className="ml-2 rounded-full bg-[#3c8dbc]/10 px-2 py-0.5 text-xs text-[#3c8dbc]">
                      Nhóm: {positionCategoryLabel(positionCategoryParam)}
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={data.first}
                    onClick={() => setPage(page - 1)}
                    className="lte-btn lte-btn-ghost lte-btn-sm disabled:pointer-events-none disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={data.last}
                    onClick={() => setPage(page + 1)}
                    className="lte-btn lte-btn-ghost lte-btn-sm disabled:pointer-events-none disabled:opacity-40"
                  >
                    Sau
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
            className="lte-modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8ecf0] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="master-modal-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2f6] bg-gradient-to-r from-[#fafcfd] to-white px-5 py-4">
              <h4 id="master-modal-title" className="text-lg font-semibold text-[#2c3e50]">
                {editingId == null ? `Thêm ${m.crumb.toLowerCase()}` : `Sửa ${m.crumb.toLowerCase()}`}
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
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-5">
              {formError && (
                <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                  <FaIcon icon="fa-solid fa-triangle-exclamation" className="mt-0.5" />
                  {formError}
                </p>
              )}
              <Field
                label={m.codeLabel}
                error={
                  fieldErrors.rankCode ||
                  fieldErrors.facultyCode ||
                  fieldErrors.buildingCode ||
                  fieldErrors.courseCode ||
                  fieldErrors.departmentCode ||
                  fieldErrors.positionCode
                }
                input={
                  <input
                    required={kind !== "building"}
                    className="lte-input w-full"
                    value={
                      kind === "building" && editingId == null ? "Tự động: TN001, TN002, ..." : form.code
                    }
                    readOnly={kind === "building"}
                    disabled={kind === "building"}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  />
                }
              />
              <Field
                label={m.nameLabel}
                error={
                  fieldErrors.rankName ||
                  fieldErrors.facultyName ||
                  fieldErrors.buildingName ||
                  fieldErrors.courseName ||
                  fieldErrors.departmentName ||
                  fieldErrors.positionName
                }
                input={
                  <input
                    required
                    className="lte-input w-full"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                }
              />
              {kind === "course" && (
                <Field
                  label="Số tín chỉ"
                  error={fieldErrors.credits}
                  input={
                    <input
                      type="number"
                      required
                      min={1}
                      max={50}
                      className="lte-input w-full"
                      value={form.credits}
                      onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
                    />
                  }
                />
              )}
              {kind === "position" && (
                <div>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-sm font-semibold text-[#495057]">Nhóm chức vụ</label>
                    <button
                      type="button"
                      onClick={openPositionCategoryAddDialog}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#3c8dbc]/35 bg-[#3c8dbc]/8 text-[#2f7494] transition-colors hover:bg-[#3c8dbc]/15"
                      title="Thêm mã nhóm mới"
                      aria-label="Thêm mã nhóm mới"
                    >
                      <FaIcon icon="fa-solid fa-square-plus" className="text-base" />
                    </button>
                  </div>
                  <select
                    className="lte-input w-full"
                    value={form.positionCategory}
                    onChange={(e) => setForm((f) => ({ ...f, positionCategory: e.target.value }))}
                  >
                    <option value="">— Không gán nhóm —</option>
                    {positionCategorySelectList.map((c) => (
                      <option key={c} value={c}>
                        {positionCategoryLabel(c)} ({c})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.positionCategory && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      <FaIcon icon="fa-solid fa-circle-xmark" className="mr-1" />
                      {fieldErrors.positionCategory}
                    </p>
                  )}
                </div>
              )}
              <Field
                label="Mô tả"
                error={fieldErrors.description}
                input={
                  <textarea
                    className="lte-input min-h-[88px] w-full resize-y"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                }
              />
              <div className="flex flex-wrap justify-end gap-2 border-t border-[#eef2f6] pt-4">
                <button type="button" onClick={closeModal} className="lte-btn lte-btn-ghost lte-btn-sm">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="lte-btn lte-btn-primary lte-btn-sm"
                >
                  {saving ? "Đang lưu…" : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {kind === "position" && positionCategoryAddOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
          role="presentation"
          onClick={() => {
            setPositionCategoryAddOpen(false);
            setNewPositionCategoryError(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#e8ecf0] bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-cat-add-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h5
                id="pos-cat-add-title"
                className="flex items-center gap-2 text-base font-semibold text-[#2c3e50]"
              >
                <FaIcon icon="fa-solid fa-square-plus" className="text-[#3c8dbc]" />
                Thêm mã nhóm chức vụ
              </h5>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6c757d] hover:bg-[#f1f3f5]"
                aria-label="Đóng"
                onClick={() => {
                  setPositionCategoryAddOpen(false);
                  setNewPositionCategoryError(null);
                }}
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-lg" />
              </button>
            </div>
            <p className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-[#6c757d]">
              <FaIcon icon="fa-solid fa-circle-info" className="mt-0.5 shrink-0 text-[#3c8dbc]" />
              <span>
                Mã dùng để lọc và lưu (VD: GIANG_DAY, PHO_KHOA). Khoảng trắng được thay bằng dấu gạch
                dưới. Tối đa 100 ký tự.
              </span>
            </p>
            <input
              className="lte-input w-full font-mono text-sm"
              value={newPositionCategoryInput}
              onChange={(e) => {
                setNewPositionCategoryInput(e.target.value);
                setNewPositionCategoryError(null);
              }}
              placeholder="Nhập mã nhóm…"
              maxLength={100}
              autoFocus
            />
            {newPositionCategoryError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <FaIcon icon="fa-solid fa-circle-exclamation" />
                {newPositionCategoryError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2 border-t border-[#eef2f6] pt-4">
              <button
                type="button"
                className="lte-btn lte-btn-ghost lte-btn-sm"
                onClick={() => {
                  setPositionCategoryAddOpen(false);
                  setNewPositionCategoryError(null);
                }}
              >
                <FaIcon icon="fa-solid fa-ban" />
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmAddPositionCategory}
                className="lte-btn lte-btn-primary lte-btn-sm"
              >
                <FaIcon icon="fa-solid fa-check" />
                Thêm nhóm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  input,
  error,
}: {
  label: string;
  input: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#495057]">{label}</label>
      {input}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">
          <FaIcon icon="fa-solid fa-circle-xmark" className="mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}
