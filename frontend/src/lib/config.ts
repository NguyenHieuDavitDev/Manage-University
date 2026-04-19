export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8080"
  );
}

/** API địa giới hành chính Việt Nam (Open API Provinces). */
export function getVnAddressApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_VN_ADDRESS_API?.replace(/\/$/, "") ||
    "https://provinces.open-api.vn/api/v1"
  );
}
