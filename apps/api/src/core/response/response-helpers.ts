export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

export const successResponse = <T>(data: T): SuccessResponse<T> => ({
  success: true,
  data,
});

export const createdResponse = <T>(data: T): SuccessResponse<T> => ({
  success: true,
  data,
});

export const listResponse = <T>(data: T[]): SuccessResponse<T[]> => ({
  success: true,
  data,
});

export const paginatedResponse = <T>(
  data: T[],
  pagination: { page: number; limit: number; total: number },
): PaginatedResponse<T> => ({
  success: true,
  data,
  pagination: {
    ...pagination,
    hasMore: pagination.page * pagination.limit < pagination.total,
  },
});
