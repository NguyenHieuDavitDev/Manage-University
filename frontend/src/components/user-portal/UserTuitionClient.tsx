"use client";

import { FaIcon } from "@/components/FaIcon";
import { UserPageHeading } from "@/components/user-portal/UserPageHeading";
import { UserSurface } from "@/components/user-portal/UserSurface";
import {
  createMyTuitionPayment,
  fetchMyInvoiceHtml,
  fetchMyPaymentHistory,
  fetchMyStudentTuitions,
} from "@/lib/api/studentTuitions";
import type {
  StudentTuition,
  StudentTuitionPaymentHistory,
  StudentTuitionPaymentMethod,
} from "@/lib/types/hrEntities";
import { useCallback, useEffect, useState } from "react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export function UserTuitionClient() {
  const [rows, setRows] = useState<StudentTuition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [methods, setMethods] = useState<Record<number, StudentTuitionPaymentMethod>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [history, setHistory] = useState<StudentTuitionPaymentHistory[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tuitionData, historyData] = await Promise.all([
        fetchMyStudentTuitions(),
        fetchMyPaymentHistory(),
      ]);
      setRows(tuitionData);
      setHistory(historyData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu học phí");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    void load();
  }, [load]);

  async function submitPay(row: StudentTuition) {
    const raw = amounts[row.id] ?? "";
    const amount = Number(raw);
    const remain = Math.max(0, row.amountDue - row.amountPaid);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    if (amount > remain) {
      setError("Số tiền vượt quá phần học phí còn lại");
      return;
    }
    setSubmitting((s) => ({ ...s, [row.id]: true }));
    setError(null);
    const paymentMethod = methods[row.id] ?? "MOMO";
    try {
      const res = await createMyTuitionPayment(row.id, {
        amount,
        paymentMethod,
        note: notes[row.id] ?? "",
      });
      if (paymentMethod === "MOMO") {
        if (!res.payUrl) throw new Error("MoMo chưa trả về đường dẫn thanh toán");
        window.open(res.payUrl, "_blank", "noopener,noreferrer");
      } else if (res.paymentId) {
        const html = await fetchMyInvoiceHtml(res.paymentId);
        // Không dùng noopener vì cần document.write vào popup
        const popup = window.open("", "_blank");
        if (!popup) {
          setError(
            "Trình duyệt đã chặn popup. Vui lòng cho phép popup với trang này rồi thử lại."
          );
        } else {
          popup.document.open();
          popup.document.write(html);
          popup.document.close();
        }
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo thanh toán");
    } finally {
      setSubmitting((s) => ({ ...s, [row.id]: false }));
    }
  }

  return (
    <>
      <UserPageHeading
        title="Học phí"
        description="Thanh toán học phí theo từng học kỳ với nhiều phương thức: MoMo, chuyển khoản, thẻ, hoặc ghi nhận thủ công. Bạn có thể đóng nhiều lần cho đến khi đủ số tiền phải đóng."
        breadcrumbs={[{ label: "Trang chủ", href: "/user" }, { label: "Học phí" }]}
      />
      <UserSurface title="Danh sách học phí theo học kỳ" titleIcon="fa-solid fa-money-check-dollar">
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FaIcon icon="fa-solid fa-rotate" />
            Tải lại
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="border-b px-3 py-2">Năm học</th>
                <th className="border-b px-3 py-2">HK</th>
                <th className="border-b px-3 py-2">Phải đóng</th>
                <th className="border-b px-3 py-2">Đã đóng</th>
                <th className="border-b px-3 py-2">Còn lại</th>
                <th className="border-b px-3 py-2">Trạng thái</th>
                <th className="border-b px-3 py-2">Thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    Chưa có dữ liệu học phí
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const remain = Math.max(0, row.amountDue - row.amountPaid);
                const disabled = remain <= 0 || submitting[row.id];
                return (
                  <tr key={row.id} className="align-top">
                    <td className="border-b px-3 py-3">{row.academicYear}</td>
                    <td className="border-b px-3 py-3">{row.semester}</td>
                    <td className="border-b px-3 py-3">{formatCurrency(row.amountDue)}</td>
                    <td className="border-b px-3 py-3">{formatCurrency(row.amountPaid)}</td>
                    <td className="border-b px-3 py-3 font-semibold text-amber-700">
                      {formatCurrency(remain)}
                    </td>
                    <td className="border-b px-3 py-3">{row.paymentStatus}</td>
                    <td className="border-b px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-2">
                          <input
                            type="number"
                            min={1}
                            max={Math.floor(remain)}
                            value={amounts[row.id] ?? ""}
                            disabled={remain <= 0}
                            onChange={(e) =>
                              setAmounts((s) => ({
                                ...s,
                                [row.id]: e.target.value,
                              }))
                            }
                            placeholder="Số tiền"
                            className="w-36 rounded-lg border border-slate-300 px-2 py-1.5"
                          />
                          <select
                            value={methods[row.id] ?? "MOMO"}
                            disabled={remain <= 0}
                            onChange={(e) =>
                              setMethods((s) => ({
                                ...s,
                                [row.id]: e.target.value as StudentTuitionPaymentMethod,
                              }))
                            }
                            className="w-44 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                          >
                            <option value="MOMO">MoMo</option>
                            <option value="BANK_TRANSFER">Chuyển khoản</option>
                            <option value="CARD">Thẻ</option>
                            <option value="MANUAL">Thủ công</option>
                          </select>
                          {(methods[row.id] ?? "MOMO") !== "MOMO" && (
                            <input
                              value={notes[row.id] ?? ""}
                              disabled={remain <= 0}
                              onChange={(e) =>
                                setNotes((s) => ({
                                  ...s,
                                  [row.id]: e.target.value,
                                }))
                              }
                              placeholder="Ghi chú thanh toán thủ công"
                              className="w-56 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => void submitPay(row)}
                          className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FaIcon icon="fa-solid fa-wallet" />
                          {submitting[row.id] ? "Đang xử lý..." : "Thanh toán"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </UserSurface>

      <UserSurface
        id="payment-history-stats"
        title="Lịch sử thanh toán"
        titleIcon="fa-solid fa-clock-rotate-left"
        className="mt-6"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="border-b px-3 py-2">Thời gian</th>
                <th className="border-b px-3 py-2">Năm học</th>
                <th className="border-b px-3 py-2">HK</th>
                <th className="border-b px-3 py-2">Số tiền</th>
                <th className="border-b px-3 py-2">Phương thức</th>
                <th className="border-b px-3 py-2">Trạng thái</th>
                <th className="border-b px-3 py-2">Số hóa đơn</th>
              </tr>
            </thead>
            <tbody>
              {!loading && history.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    Chưa có lịch sử thanh toán
                  </td>
                </tr>
              )}
              {history.map((item) => (
                <tr key={item.paymentId}>
                  <td className="border-b px-3 py-3">
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="border-b px-3 py-3">{item.academicYear}</td>
                  <td className="border-b px-3 py-3">{item.semester}</td>
                  <td className="border-b px-3 py-3 font-semibold">{formatCurrency(item.amount)}</td>
                  <td className="border-b px-3 py-3">{item.paymentMethod}</td>
                  <td className="border-b px-3 py-3">{item.status}</td>
                  <td className="border-b px-3 py-3">{item.invoiceNo ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </UserSurface>
    </>
  );
}
