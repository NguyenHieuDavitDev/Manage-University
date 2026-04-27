"use client";

import { FaIcon } from "@/components/FaIcon";
import {
  createGradeScale,
  deleteGradeScale,
  fetchGradeScales,
  updateGradeScale,
} from "@/lib/api/gradeScales";
import type { GradeScale, GradeScalePayload } from "@/lib/types/gradeScale";
import { useEffect, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

type FormState = { letterGrade: string; minScore: string; maxScore: string; description: string };

function emptyForm(): FormState {
  return { letterGrade: "", minScore: "", maxScore: "", description: "" };
}

export default function AdminGradeScalesClient() {
  const [rows, setRows] = useState<GradeScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchGradeScales());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(row: GradeScale) {
    setEditingId(row.id);
    setForm({
      letterGrade: row.letterGrade,
      minScore: String(row.minScore),
      maxScore: String(row.maxScore),
      description: row.description ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const minScore = Number(form.minScore.trim());
    const maxScore = Number(form.maxScore.trim());
    if (!Number.isFinite(minScore) || minScore < 0 || minScore > 10) {
      alert("Điểm min phải trong khoảng 0..10");
      return;
    }
    if (!Number.isFinite(maxScore) || maxScore < 0 || maxScore > 10) {
      alert("Điểm max phải trong khoảng 0..10");
      return;
    }
    if (minScore > maxScore) {
      alert("Điểm min phải nhỏ hơn hoặc bằng điểm max");
      return;
    }
    const payload: GradeScalePayload = {
      letterGrade: form.letterGrade.trim().toUpperCase(),
      minScore,
      maxScore,
      description: form.description.trim() || null,
    };
    setSaving(true);
    try {
      if (editingId == null) await createGradeScale(payload);
      else await updateGradeScale(editingId, payload);
      setModalOpen(false);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa thang điểm này?")) return;
    try {
      await deleteGradeScale(id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xóa thất bại");
    }
  }

  return (
    <>
      <ContentHeader
        title="Thang điểm chữ"
        titleIcon="fa-solid fa-ranking-star"
        breadcrumbs={[{ label: "Trang chủ", href: "/admin" }, { label: "Thang điểm chữ" }]}
      />
      <LteCard
        title="Danh sách thang điểm"
        titleIcon="fa-solid fa-table-list"
        tools={
          <button type="button" onClick={openCreate} className="lte-btn lte-btn-primary lte-btn-sm">
            <FaIcon icon="fa-solid fa-plus" /> Thêm thang điểm
          </button>
        }
      >
        {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
        {loading ? (
          <p className="text-sm text-[#6c757d]">Đang tải...</p>
        ) : (
          <div className="lte-table-wrap overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-[#e3e8ec] px-3 py-2 text-left font-semibold">Xếp loại</th>
                  <th className="border-b border-[#e3e8ec] px-3 py-2 text-left font-semibold">Khoảng điểm</th>
                  <th className="border-b border-[#e3e8ec] px-3 py-2 text-left font-semibold">Mô tả</th>
                  <th className="border-b border-[#e3e8ec] px-3 py-2 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[#f0f3f6] last:border-0">
                    <td className="px-3 py-2 font-semibold">{r.letterGrade}</td>
                    <td className="px-3 py-2">
                      {r.minScore} - {r.maxScore}
                    </td>
                    <td className="px-3 py-2">{r.description || "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="lte-btn lte-btn-ghost lte-btn-sm mr-1"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(r.id)}
                        className="lte-btn lte-btn-danger lte-btn-sm"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LteCard>

      {modalOpen && (
        <div className="lte-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h4 className="mb-4 text-lg font-semibold">{editingId == null ? "Thêm thang điểm" : "Sửa thang điểm"}</h4>
            <form onSubmit={(e) => void handleSave(e)} className="space-y-3">
              <input
                required
                className="lte-input w-full"
                placeholder="Ký tự xếp loại (A, B, C...)"
                value={form.letterGrade}
                onChange={(e) => setForm((f) => ({ ...f, letterGrade: e.target.value }))}
              />
              <input
                required
                type="number"
                step="0.01"
                min={0}
                max={10}
                className="lte-input w-full"
                placeholder="Điểm min"
                value={form.minScore}
                onChange={(e) => setForm((f) => ({ ...f, minScore: e.target.value }))}
              />
              <input
                required
                type="number"
                step="0.01"
                min={0}
                max={10}
                className="lte-input w-full"
                placeholder="Điểm max"
                value={form.maxScore}
                onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
              />
              <textarea
                className="lte-input w-full"
                placeholder="Mô tả"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="lte-btn lte-btn-ghost lte-btn-sm">
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="lte-btn lte-btn-primary lte-btn-sm">
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
