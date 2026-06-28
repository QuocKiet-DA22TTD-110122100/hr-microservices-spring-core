export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  _fallback?: boolean;
  _fallbackReason?: string;
}

export type RoleApiResult<T> = ApiResponse<T>;

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface SearchParams extends PaginationParams {
  keyword?: string;
  search?: string;
  department?: string;
  status?: string;
}
