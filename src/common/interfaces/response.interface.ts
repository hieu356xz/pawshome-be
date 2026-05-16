export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T | T[];
  errors?: ValidationErrorDetail[];
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  meta: ResponseMeta;
}

export type ValidationErrorResponse = {
  message: string;
  errors: ValidationErrorDetail[];
};

export interface ValidationErrorDetail {
  field: string;
  message: string[];
}

export type ControllerResponse<T> = PaginatedResponse<T> | T;
