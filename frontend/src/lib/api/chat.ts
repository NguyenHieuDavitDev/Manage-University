import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type {
  ChatApiError,
  ChatMessage,
  ChatSendMessageResponse,
  ChatSession,
} from "@/lib/types/chat";
import type { ApiErrorBody } from "@/lib/types/common";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function chatBase(): string {
  return `${getApiBaseUrl()}/api/v1/chat`;
}

function withApiError(message: string, err?: ApiErrorBody | null): ChatApiError {
  return Object.assign(new Error(message), { apiError: err || null });
}

function withApiErrorStatus(
  message: string,
  status: number,
  err?: ApiErrorBody | null
): ChatApiError {
  return Object.assign(new Error(message), { apiError: err || null, status });
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  const payload = title?.trim() ? { title: title.trim() } : {};
  const res = await apiFetch(`${chatBase()}/sessions`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw withApiErrorStatus(err?.message || "Không tạo được phiên chat", res.status, err);
  }
  return res.json();
}

export async function fetchChatSessions(): Promise<ChatSession[]> {
  const res = await apiFetch(`${chatBase()}/sessions`, { cache: "no-store" });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw withApiErrorStatus(
      err?.message || `Không tải được danh sách chat (${res.status})`,
      res.status,
      err
    );
  }
  return res.json();
}

export async function fetchChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await apiFetch(`${chatBase()}/sessions/${sessionId}/messages`, { cache: "no-store" });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw withApiErrorStatus(err?.message || "Không tải được lịch sử chat", res.status, err);
  }
  return res.json();
}

export async function sendChatMessage(
  sessionId: string,
  message: string
): Promise<ChatSendMessageResponse> {
  const res = await apiFetch(`${chatBase()}/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw withApiErrorStatus(err?.message || "Không gửi được tin nhắn", res.status, err);
  }
  return res.json();
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const res = await apiFetch(`${chatBase()}/sessions/${sessionId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw withApiErrorStatus(err?.message || "Không xóa được phiên chat", res.status, err);
  }
}
