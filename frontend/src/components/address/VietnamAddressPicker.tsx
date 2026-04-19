"use client";

import { getVnAddressApiBase } from "@/lib/config";
import { FaIcon } from "@/components/FaIcon";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type VnWard = { name: string; code: number; district_code: number };
type VnDistrict = {
  name: string;
  code: number;
  province_code: number;
  wards: VnWard[];
};
type VnProvince = { name: string; code: number; districts?: VnDistrict[] };

function clamp255(s: string): string {
  if (s.length <= 255) return s;
  return `${s.slice(0, 252)}...`;
}

type Props = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
};

export function VietnamAddressPicker({
  label,
  value,
  onChange,
  disabled,
}: Props) {
  const base = getVnAddressApiBase();
  const initiallyFilled = value.trim().length > 0;
  const [locked, setLocked] = useState(initiallyFilled);
  const snapshotRef = useRef(value);

  const [provinces, setProvinces] = useState<VnProvince[]>([]);
  const [loadProvErr, setLoadProvErr] = useState<string | null>(null);
  const [loadingProvinces, setLoadingProvinces] = useState(true);

  const [provinceDetail, setProvinceDetail] = useState<VnProvince | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [provCode, setProvCode] = useState<number | "">("");
  const [distCode, setDistCode] = useState<number | "">("");
  const [wardCode, setWardCode] = useState<number | "">("");
  const [street, setStreet] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProvinces(true);
      setLoadProvErr(null);
      try {
        const r = await fetch(`${base}/?depth=1`);
        if (!r.ok) throw new Error(String(r.status));
        const data = (await r.json()) as VnProvince[];
        if (!cancelled) setProvinces(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) {
          setProvinces([]);
          setLoadProvErr("Không tải được danh mục tỉnh/thành. Kiểm tra mạng hoặc NEXT_PUBLIC_VN_ADDRESS_API.");
        }
      } finally {
        if (!cancelled) setLoadingProvinces(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [base]);

  useEffect(() => {
    if (provCode === "") {
      setProvinceDetail(null);
      setDistCode("");
      setWardCode("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingDetail(true);
      try {
        const r = await fetch(`${base}/p/${provCode}?depth=3`);
        if (!r.ok) throw new Error(String(r.status));
        const data = (await r.json()) as VnProvince;
        if (!cancelled) {
          setProvinceDetail(data);
          setDistCode("");
          setWardCode("");
        }
      } catch {
        if (!cancelled) {
          setProvinceDetail(null);
          setDistCode("");
          setWardCode("");
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [base, provCode]);

  const composed = useMemo(() => {
    if (!provinceDetail || distCode === "" || wardCode === "") return "";
    const district = provinceDetail.districts?.find((d) => d.code === distCode);
    const ward = district?.wards?.find((w) => w.code === wardCode);
    if (!district || !ward) return "";
    const parts = [
      street.trim(),
      ward.name,
      district.name,
      provinceDetail.name,
    ].filter((p) => p.length > 0);
    return clamp255(parts.join(", "));
  }, [provinceDetail, distCode, wardCode, street]);

  const lastPushed = useRef<string | null>(null);
  useEffect(() => {
    if (locked || disabled) return;
    if (composed === lastPushed.current) return;
    lastPushed.current = composed;
    onChange(composed);
  }, [composed, locked, disabled, onChange]);

  const unlock = useCallback(() => {
    snapshotRef.current = value;
    setLocked(false);
    setProvCode("");
    setProvinceDetail(null);
    setDistCode("");
    setWardCode("");
    setStreet("");
    lastPushed.current = null;
  }, [value]);

  const cancelPick = useCallback(() => {
    onChange(snapshotRef.current);
    setLocked(snapshotRef.current.trim().length > 0);
    setProvCode("");
    setProvinceDetail(null);
    setDistCode("");
    setWardCode("");
    setStreet("");
    lastPushed.current = null;
  }, [onChange]);

  const districts = provinceDetail?.districts ?? [];
  const selectedDistrict = districts.find((d) => d.code === distCode);
  const wards = selectedDistrict?.wards ?? [];

  return (
    <div className="rounded-xl border border-[#e8ecf0] bg-[#fafcfd] p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#495057]">
        <FaIcon icon="fa-solid fa-location-dot" className="text-[#3c8dbc]" />
        {label}
      </div>

      {locked && (
        <div className="space-y-2">
          {value.trim() ? (
            <p className="rounded-lg border border-[#e3e8ec] bg-white px-3 py-2 text-sm text-[#2c3e50]">
              {value}
            </p>
          ) : (
            <p className="text-sm text-[#6c757d]">Chưa có địa chỉ.</p>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={unlock}
            className="lte-btn lte-btn-ghost lte-btn-sm border border-[#d0d7de]"
          >
            <FaIcon icon="fa-solid fa-map" />
            {value.trim() ? "Chọn lại theo Tỉnh → Huyện → Xã" : "Chọn theo danh mục hành chính"}
          </button>
        </div>
      )}

      {!locked && (
        <div className="space-y-3">
          {loadProvErr && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <FaIcon icon="fa-solid fa-triangle-exclamation" className="mt-0.5 shrink-0" />
              {loadProvErr}
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <span className="mb-1 block text-xs font-medium text-[#6c757d]">Tỉnh / Thành phố</span>
              <select
                className="lte-input w-full py-2 text-sm"
                disabled={disabled || loadingProvinces}
                value={provCode === "" ? "" : String(provCode)}
                onChange={(e) => {
                  const v = e.target.value;
                  setProvCode(v === "" ? "" : Number(v));
                }}
              >
                <option value="">
                  {loadingProvinces ? "Đang tải…" : "— Chọn —"}
                </option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1 block text-xs font-medium text-[#6c757d]">Quận / Huyện</span>
              <select
                className="lte-input w-full py-2 text-sm"
                disabled={disabled || loadingDetail || provCode === ""}
                value={distCode === "" ? "" : String(distCode)}
                onChange={(e) => {
                  const v = e.target.value;
                  setDistCode(v === "" ? "" : Number(v));
                  setWardCode("");
                }}
              >
                <option value="">{loadingDetail ? "Đang tải…" : "— Chọn —"}</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1 block text-xs font-medium text-[#6c757d]">Phường / Xã</span>
              <select
                className="lte-input w-full py-2 text-sm"
                disabled={disabled || distCode === ""}
                value={wardCode === "" ? "" : String(wardCode)}
                onChange={(e) => {
                  const v = e.target.value;
                  setWardCode(v === "" ? "" : Number(v));
                }}
              >
                <option value="">— Chọn —</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <span className="mb-1 block text-xs font-medium text-[#6c757d]">
              Số nhà, ngõ, đường (tùy chọn)
            </span>
            <input
              className="lte-input w-full text-sm"
              disabled={disabled}
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Ví dụ: 12 ngõ 4…"
            />
          </div>
          {composed ? (
            <p className="rounded-lg border border-[#cfe8f6] bg-[#e8f4fb] px-3 py-2 text-xs text-[#1a5270]">
              <span className="font-semibold">Xem trước:</span> {composed}
            </p>
          ) : (
            <p className="text-xs text-[#6c757d]">
              Chọn đủ Tỉnh, Quận/Huyện và Phường/Xã. Chuỗi gửi lên hệ thống tối đa 255 ký tự.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={cancelPick}
              className="lte-btn lte-btn-ghost lte-btn-sm"
            >
              <FaIcon icon="fa-solid fa-rotate-left" />
              {snapshotRef.current.trim() ? "Giữ địa chỉ đã lưu" : "Hủy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
