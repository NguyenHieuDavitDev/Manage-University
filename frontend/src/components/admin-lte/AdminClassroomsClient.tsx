"use client";

import { FaIcon } from "@/components/FaIcon";
import {
  createClassroom,
  deleteClassroom,
  fetchClassroomPage,
  fetchNextClassroomCode,
  updateClassroom,
} from "@/lib/api/classrooms";
import { fetchBuildingPage } from "@/lib/api/buildings";
import type { ApiErrorBody, SpringPage } from "@/lib/types/common";
import type { Building } from "@/lib/types/hrEntities";
import type { Classroom, ClassroomPayload } from "@/lib/types/classroom";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

type ClassroomForm = {
  roomCode: string;
  roomName: string;
  buildingId: number | null;
  floorNumber: string;
  capacity: string;
  description: string;
};

function emptyForm(): ClassroomForm {
  return {
    roomCode: "",
    roomName: "",
    buildingId: null,
    floorNumber: "",
    capacity: "",
    description: "",
  };
}

export default function AdminClassroomsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const qParam = (searchParams.get("q") || "").trim();
  const buildingIdRaw = searchParams.get("buildingId");
  const buildingIdFilter = buildingIdRaw && /^\d+$/.test(buildingIdRaw) ? Number(buildingIdRaw) : null;

  const [draft, setDraft] = useState(qParam);
  const [data, setData] = useState<SpringPage<Classroom> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [buildingOptions, setBuildingOptions] = useState<Building[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClassroomForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [autoCodeLoading, setAutoCodeLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setBuildingsLoading(true);
      try {
        const p = await fetchBuildingPage(0, 500, "buildingName");
        if (!cancelled) setBuildingOptions(p.content);
      } catch {
        if (!cancelled) setBuildingOptions([]);
      } finally {
        if (!cancelled) setBuildingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setDraft(qParam);
  }, [qParam]);

  useEffect(() => {
    if (!modalOpen || modalMode !== "create") return;
    const floorRaw = form.floorNumber.trim();
    if (floorRaw === "") {
      setForm((f) => ({ ...f, roomCode: "" }));
      return;
    }
    const floor = Number(floorRaw);
    if (!Number.isFinite(floor) || !Number.isInteger(floor)) {
      setForm((f) => ({ ...f, roomCode: "" }));
      return;
    }
    let cancelled = false;
    void (async () => {
      setAutoCodeLoading(true);
      try {
        const code = await fetchNextClassroomCode(floor);
        if (!cancelled) setForm((f) => ({ ...f, roomCode: code }));
      } catch {
        if (!cancelled) setForm((f) => ({ ...f, roomCode: "" }));
      } finally {
        if (!cancelled) setAutoCodeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.floorNumber, modalMode, modalOpen]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchClassroomPage(page, 10, "id,desc", qParam || undefined, buildingIdFilter);
      setData(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, qParam, buildingIdFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function pushQuery(nextPage: number, nextQ: string, nextBuildingId: number | null | undefined) {
    const p = new URLSearchParams();
    p.set("page", String(nextPage));
    const t = nextQ.trim();
    if (t) p.set("q", t);
    const bid = nextBuildingId === undefined ? buildingIdFilter : nextBuildingId;
    if (bid != null) p.set("buildingId", String(bid));
    router.push(`?${p.toString()}`);
  }

  function setPage(p: number) {
    pushQuery(p, qParam, undefined);
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    pushQuery(0, draft, undefined);
  }

  function clearSearch() {
    setDraft("");
    pushQuery(0, "", null);
  }

  function openCreate() {
    setModalMode("create");
    setEditingId(null);
    setForm({
      ...emptyForm(),
      buildingId: buildingIdFilter,
    });
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(row: Classroom) {
    setModalMode("edit");
    setEditingId(row.id);
    setForm({
      roomCode: row.roomCode,
      roomName: row.roomName,
      buildingId: row.buildingId,
      floorNumber: row.floorNumber != null ? String(row.floorNumber) : "",
      capacity: row.capacity != null ? String(row.capacity) : "",
      description: row.description ?? "",
    });
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    if (form.buildingId == null) {
      setFormError("Chọn tòa nhà.");
      return;
    }

    const floorRaw = form.floorNumber.trim();
    let floorNumber: number;
    if (floorRaw === "") {
      setFieldErrors({ floorNumber: "Nhập tầng để hệ thống sinh mã phòng tự động." });
      return;
    }
    const n = Number(floorRaw);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      setFieldErrors({ floorNumber: "Tầng phải là số nguyên." });
      return;
    }
    floorNumber = n;

    const capacityRaw = form.capacity.trim();
    let capacity: number | null | undefined;
    if (capacityRaw === "") {
      capacity = null;
    } else {
      const n = Number(capacityRaw);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
        setFieldErrors({ capacity: "Sức chứa phải là số nguyên dương hoặc để trống." });
        return;
      }
      capacity = n;
    }

    setSaving(true);
    try {
      const payload: ClassroomPayload = {
        roomName: form.roomName.trim(),
        buildingId: form.buildingId,
        floorNumber,
        capacity,
        description: form.description.trim() || null,
      };
      if (modalMode === "create") {
        await createClassroom(payload);
      } else if (editingId != null) {
        payload.roomCode = form.roomCode.trim();
        await updateClassroom(editingId, payload);
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

  async function handleDelete(row: Classroom) {
    if (!confirm(`Xóa phòng ${row.roomCode} (${row.roomName})?`)) return;
    try {
      await deleteClassroom(row.id);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  const hasActiveFilters = Boolean(qParam) || buildingIdFilter != null;

  return (
    <>
      <ContentHeader
        title="Quản lý phòng học"
        titleIcon="fa-solid fa-door-open"
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Phòng học" },
        ]}
      />

      <LteCard
        title="Danh sách phòng học"
        titleIcon="fa-solid fa-list-check"
        tools={
          <button type="button" onClick={openCreate} className="lte-btn lte-btn-primary lte-btn-sm shadow-sm">
            <FaIcon icon="fa-solid fa-plus" />
            Thêm phòng
          </button>
        }
      >
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#e3e8ec] bg-white p-4 shadow-sm sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6c757d]">
              <FaIcon icon="fa-solid fa-building" className="text-[#3c8dbc]" />
              Lọc theo tòa nhà
            </label>
            <select
              className="lte-input w-full max-w-md text-sm"
              disabled={buildingsLoading}
              value={buildingIdFilter ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                pushQuery(0, qParam, v === "" ? null : Number(v));
              }}
            >
              <option value="">Tất cả tòa nhà</option>
              {buildingOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.buildingCode} — {b.buildingName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={applySearch} className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            name="q"
            className="lte-input min-w-0 flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tìm theo mã phòng, tên phòng, mã/tên tòa nhà…"
          />
          <div className="flex shrink-0 gap-2">
            <button type="submit" className="lte-btn lte-btn-primary lte-btn-sm">
              <FaIcon icon="fa-solid fa-magnifying-glass" />
              Tìm kiếm
            </button>
            {hasActiveFilters && (
              <button type="button" onClick={clearSearch} className="lte-btn lte-btn-ghost lte-btn-sm">
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
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Mã phòng</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Tên phòng</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Tòa nhà</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Tầng</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Sức chứa</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Mô tả</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center text-[#6c757d]">
                        <FaIcon icon="fa-solid fa-filter-circle-xmark" className="mb-2 text-4xl" />
                        <p className="text-sm font-medium text-[#495057]">Không có dữ liệu</p>
                        <p className="text-xs">Thử bỏ lọc hoặc thêm phòng học mới.</p>
                      </td>
                    </tr>
                  )}
                  {data.content.map((row) => (
                    <tr key={row.id} className="border-b border-[#f0f3f6] last:border-0">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#495057]">{row.roomCode}</td>
                      <td className="px-4 py-3 font-medium text-[#2c3e50]">{row.roomName}</td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-[#3c8dbc]">{row.buildingCode}</div>
                        <div className="text-[#495057]">{row.buildingName}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[#495057]">{row.floorNumber ?? "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-[#495057]">{row.capacity ?? "—"}</td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-[#6c757d]">{row.description || "—"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="lte-btn lte-btn-ghost lte-btn-sm mr-1 border-transparent text-[#3c8dbc] hover:bg-[#3c8dbc]/10"
                        >
                          <FaIcon icon="fa-solid fa-pen-to-square" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row)}
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
                <span>
                  Trang {data.number + 1}/{data.totalPages} — {data.totalElements} bản ghi
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
            className="lte-modal-panel max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8ecf0] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="classroom-modal-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2f6] bg-gradient-to-r from-[#fafcfd] to-white px-5 py-4">
              <h4 id="classroom-modal-title" className="text-lg font-semibold text-[#2c3e50]">
                {modalMode === "create" ? "Thêm phòng học" : "Sửa phòng học"}
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
                label="Mã phòng *"
                error={fieldErrors.roomCode}
                input={
                  <input
                    required={modalMode !== "create"}
                    className="lte-input w-full font-mono"
                    value={form.roomCode}
                    readOnly={modalMode === "create"}
                    onChange={(e) => setForm((f) => ({ ...f, roomCode: e.target.value.toUpperCase() }))}
                    placeholder={modalMode === "create" ? "Nhập tầng để sinh mã tự động" : "VD: A101, B203"}
                  />
                }
              />
              {modalMode === "create" && (
                <p className="text-xs text-[#6c757d]">
                  {autoCodeLoading
                    ? "Đang sinh mã phòng tự động..."
                    : "Mã phòng tự động theo tầng: P101, P102... (tầng 2: P201...)."}
                </p>
              )}

              <Field
                label="Tên phòng *"
                error={fieldErrors.roomName}
                input={
                  <input
                    required
                    className="lte-input w-full"
                    value={form.roomName}
                    onChange={(e) => setForm((f) => ({ ...f, roomName: e.target.value }))}
                  />
                }
              />

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#495057]">Tòa nhà *</label>
                <select
                  required
                  className="lte-input w-full"
                  disabled={buildingsLoading}
                  value={form.buildingId ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, buildingId: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                >
                  <option value="">— Chọn tòa nhà —</option>
                  {buildingOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.buildingCode} — {b.buildingName}
                    </option>
                  ))}
                </select>
                {fieldErrors.buildingId && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.buildingId}</p>}
              </div>

              <Field
                label="Tầng"
                error={fieldErrors.floorNumber}
                input={
                  <input
                    type="number"
                    className="lte-input w-full"
                    value={form.floorNumber}
                    onChange={(e) => setForm((f) => ({ ...f, floorNumber: e.target.value }))}
                    placeholder="VD: 1, 2, 3..."
                  />
                }
              />

              <Field
                label="Sức chứa"
                error={fieldErrors.capacity}
                input={
                  <input
                    type="number"
                    min={1}
                    className="lte-input w-full"
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                    placeholder="Để trống nếu chưa quy định"
                  />
                }
              />

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
                <button type="submit" disabled={saving} className="lte-btn lte-btn-primary lte-btn-sm">
                  {saving ? "Đang lưu…" : "Lưu"}
                </button>
              </div>
            </form>
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
