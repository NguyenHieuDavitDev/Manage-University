"use client";

import { FaIcon } from "@/components/FaIcon";
import { UserPageHeading } from "@/components/user-portal/UserPageHeading";
import { UserSurface } from "@/components/user-portal/UserSurface";
import {
  createChatSession,
  deleteChatSession,
  fetchChatMessages,
  fetchChatSessions,
  sendChatMessage,
} from "@/lib/api/chat";
import { clearAccessToken } from "@/lib/auth-storage";
import type { ChatApiError, ChatMessage, ChatSession } from "@/lib/types/chat";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const QUICK_PROMPTS = [
  "Em thích công nghệ, nên chọn ngành gì?",
  "Ngành Kỹ thuật phần mềm có khó không?",
  "Lộ trình học lập trình từ đầu như thế nào?",
  "Ngành Kinh tế vs Quản trị kinh doanh khác nhau thế nào?",
  "Làm thế nào để chọn ngành phù hợp với bản thân?",
  "Kỹ năng nào quan trọng nhất cho sinh viên IT?",
];

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/** Hiển thị nội dung tin nhắn, giữ nguyên xuống dòng và in đậm **text** */
function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1 leading-relaxed">
      {lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className={line.startsWith("- ") || line.startsWith("• ") ? "pl-3" : ""}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="mr-auto flex max-w-[85%] items-end gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
        AI
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex h-4 items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}

export function UserMajorAdvisorChatClient() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentSession = useMemo(
    () => sessions.find((s) => s.sessionId === currentSessionId) ?? null,
    [sessions, currentSessionId]
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  function handleAuthError(status?: number): boolean {
    if (status !== 401) return false;
    clearAccessToken();
    router.replace("/login?next=%2Fuser%2Fchat");
    return true;
  }

  async function reloadSessions(selectLast = false): Promise<ChatSession[]> {
    const list = await fetchChatSessions();
    setSessions(list);
    if (list.length === 0) {
      setCurrentSessionId(null);
      setMessages([]);
      return list;
    }
    if (selectLast) {
      setCurrentSessionId(list[0].sessionId);
      return list;
    }
    setCurrentSessionId((prev) => {
      if (!prev) return list[0].sessionId;
      return list.some((s) => s.sessionId === prev) ? prev : list[0].sessionId;
    });
    return list;
  }

  // Khởi tạo: load sessions, nếu chưa có thì tự tạo
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingSessions(true);
      try {
        let list = await fetchChatSessions();
        if (list.length === 0) {
          const created = await createChatSession("Cuộc trò chuyện mới");
          list = [created];
        }
        if (cancelled) return;
        setSessions(list);
        setCurrentSessionId(list[0].sessionId);
      } catch (e) {
        const err = e as ChatApiError;
        if (handleAuthError(err.status)) return;
        if (!cancelled) {
          setFlash({ type: "err", text: e instanceof Error ? e.message : "Không tải được phiên chat" });
        }
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages khi đổi session
  useEffect(() => {
    if (!currentSessionId) return;
    let cancelled = false;
    void (async () => {
      setLoadingMessages(true);
      setMessages([]);
      try {
        const list = await fetchChatMessages(currentSessionId);
        if (!cancelled) setMessages(list);
      } catch (e) {
        const err = e as ChatApiError;
        if (handleAuthError(err.status)) return;
        if (!cancelled) {
          if (err.status === 400 || err.status === 403 || err.status === 404) {
            void reloadSessions(false);
            setFlash({ type: "err", text: "Phiên chat không còn hợp lệ, đang làm mới..." });
            return;
          }
          setFlash({ type: "err", text: e instanceof Error ? e.message : "Không tải được lịch sử chat" });
        }
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]);

  async function onCreateSession() {
    setFlash(null);
    try {
      await createChatSession("Cuộc trò chuyện mới");
      await reloadSessions(true);
    } catch (e) {
      const err = e as ChatApiError;
      if (handleAuthError(err.status)) return;
      setFlash({ type: "err", text: e instanceof Error ? e.message : "Không tạo được phiên chat" });
    }
  }

  async function onDeleteSession(sessionId: string) {
    if (!globalThis.confirm("Xóa phiên trò chuyện này?")) return;
    setFlash(null);
    try {
      await deleteChatSession(sessionId);
      await reloadSessions(false);
      setFlash({ type: "ok", text: "Đã xóa phiên trò chuyện." });
    } catch (e) {
      const err = e as ChatApiError;
      if (handleAuthError(err.status)) return;
      setFlash({ type: "err", text: e instanceof Error ? e.message : "Không xóa được phiên chat" });
    }
  }

  async function doSend(text: string) {
    const msg = text.trim();
    if (!currentSessionId || !msg || sending) return;
    setDraft("");
    setFlash(null);
    setSending(true);
    // Optimistic: hiển thị ngay tin nhắn user
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      messageId: tempId,
      role: "user",
      content: msg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    try {
      const sent = await sendChatMessage(currentSessionId, msg);
      // Thay optimistic bằng kết quả thực
      setMessages((prev) => [
        ...prev.filter((m) => m.messageId !== tempId),
        sent.userMessage,
        sent.assistantMessage,
      ]);
      void reloadSessions(false);
    } catch (e) {
      const err = e as ChatApiError;
      if (handleAuthError(err.status)) return;
      // Xoá optimistic nếu lỗi
      setMessages((prev) => prev.filter((m) => m.messageId !== tempId));
      setDraft(msg);
      if (err.status === 400 || err.status === 403 || err.status === 404) {
        void reloadSessions(false);
      }
      setFlash({ type: "err", text: e instanceof Error ? e.message : "Không gửi được tin nhắn" });
    } finally {
      setSending(false);
    }
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    await doSend(draft);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void doSend(draft);
    }
  }

  return (
    <>
      <UserPageHeading
        title="Trợ lý AI"
        description="Hỏi bất kỳ điều gì: tư vấn ngành học, lộ trình học tập, kỹ năng nghề nghiệp, hay bất kỳ câu hỏi nào khác."
        breadcrumbs={[{ label: "Trang chủ", href: "/user" }, { label: "Trợ lý AI" }]}
      />

      {flash && (
        <div
          role="alert"
          className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            flash.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <FaIcon
            icon={flash.type === "ok" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"}
            className="mt-0.5 shrink-0"
          />
          <span>{flash.text}</span>
          <button
            type="button"
            onClick={() => setFlash(null)}
            className="ml-auto text-current opacity-60 hover:opacity-100"
            aria-label="Đóng"
          >
            <FaIcon icon="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar: danh sách phiên */}
        <UserSurface title="Phiên chat" titleIcon="fa-solid fa-comments">
          <button
            type="button"
            onClick={() => void onCreateSession()}
            className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
          >
            <FaIcon icon="fa-solid fa-plus" />
            Tạo phiên mới
          </button>

          {loadingSessions && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
              Đang tải...
            </div>
          )}
          {!loadingSessions && sessions.length === 0 && (
            <p className="text-sm text-slate-500">Chưa có phiên nào.</p>
          )}

          <ul className="space-y-1.5">
            {sessions.map((s) => {
              const active = s.sessionId === currentSessionId;
              return (
                <li key={s.sessionId} className="group relative">
                  <button
                    type="button"
                    onClick={() => setCurrentSessionId(s.sessionId)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <p className="line-clamp-2 pr-6 text-sm font-medium leading-snug">{s.title}</p>
                    <p className="mt-1 text-[11px] opacity-60">
                      {s.totalMessages} tin · {fmtTime(s.updatedAt)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteSession(s.sessionId)}
                    title="Xóa phiên"
                    className="absolute right-2 top-2.5 hidden rounded-lg p-1 text-slate-400 transition hover:text-red-600 group-hover:flex"
                  >
                    <FaIcon icon="fa-solid fa-trash-can" className="text-xs" />
                  </button>
                </li>
              );
            })}
          </ul>
        </UserSurface>

        {/* Khu vực chat chính */}
        <UserSurface
          title={currentSession?.title ?? "Trợ lý AI"}
          titleIcon="fa-solid fa-robot"
          className="flex flex-col"
        >
          {!currentSessionId && !loadingSessions && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl text-indigo-500">
                <FaIcon icon="fa-solid fa-robot" />
              </div>
              <p className="text-slate-600">Tạo phiên mới để bắt đầu trò chuyện với AI.</p>
              <button
                type="button"
                onClick={() => void onCreateSession()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <FaIcon icon="fa-solid fa-plus" />
                Tạo phiên mới
              </button>
            </div>
          )}

          {currentSessionId && (
            <div className="flex flex-1 flex-col gap-4">
              {/* Khu vực messages */}
              <div className="min-h-[400px] max-h-[520px] flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-200/70 bg-gradient-to-b from-slate-50 to-white p-4">
                {loadingMessages && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                    Đang tải lịch sử...
                  </div>
                )}

                {!loadingMessages && messages.length === 0 && (
                  <div className="flex flex-col items-center gap-6 py-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-400">
                      <FaIcon icon="fa-solid fa-comments" />
                    </div>
                    <p className="text-sm text-slate-500 text-center max-w-xs">
                      Xin chào! Tôi là trợ lý AI. Bạn có thể hỏi bất kỳ điều gì.
                    </p>
                    {/* Gợi ý nhanh */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {QUICK_PROMPTS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => void doSend(p)}
                          disabled={sending}
                          className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m) => (
                  <div
                    key={m.messageId}
                    className={`group flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-sm ring-1 ${
                        m.role === "user"
                          ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white ring-indigo-200"
                          : "bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 ring-indigo-100"
                      }`}
                    >
                      {m.role === "user" ? "Bạn" : "AI"}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`relative max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md ${
                        m.role === "user"
                          ? "rounded-br-sm bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                          : "rounded-bl-sm border border-slate-200/80 bg-white/95 text-slate-800 backdrop-blur"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`absolute bottom-2 h-3 w-3 rotate-45 ${
                          m.role === "user"
                            ? "-right-1 bg-violet-600"
                            : "-left-1 border-b border-r border-slate-200/80 bg-white"
                        }`}
                      />
                      <MessageContent content={m.content} />
                      <p
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] ${
                          m.role === "user"
                            ? "bg-white/15 text-indigo-100"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {fmtTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}

                {sending && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input box */}
              <form onSubmit={(e) => void onSend(e)} className="flex items-end gap-2">
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={2}
                    placeholder="Nhập câu hỏi... (Enter để gửi, Shift+Enter để xuống dòng)"
                    disabled={sending}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="flex h-[72px] w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  title="Gửi (Enter)"
                >
                  {sending ? (
                    <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-base" />
                  ) : (
                    <FaIcon icon="fa-solid fa-paper-plane" className="text-base" />
                  )}
                </button>
              </form>
              <p className="text-center text-[11px] text-slate-400">
                Nhấn <kbd className="rounded border border-slate-200 px-1 font-mono">Enter</kbd> để gửi
                &nbsp;·&nbsp;
                <kbd className="rounded border border-slate-200 px-1 font-mono">Shift+Enter</kbd> để xuống dòng
              </p>
            </div>
          )}
        </UserSurface>
      </div>
    </>
  );
}
