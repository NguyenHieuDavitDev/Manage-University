import type { ApiErrorBody } from "@/lib/types/common";

export interface ChatSession {
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  totalMessages: number;
}

export interface ChatMessage {
  messageId: string;
  role: "user" | "assistant" | string;
  content: string;
  createdAt: string;
}

export interface ChatSendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export type ChatApiError = Error & {
  apiError?: ApiErrorBody | null;
  status?: number;
};
