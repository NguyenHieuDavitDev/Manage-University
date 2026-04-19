export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ApiErrorBody {
  timestamp?: string;
  status: number;
  error?: string;
  message?: string;
  path?: string;
  details?: Record<string, string>;
}
