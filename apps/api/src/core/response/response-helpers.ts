/**
 * Consistent response envelope helpers.
 *
 * These match the `{ success: true, data }` shape already returned by most
 * routes today, so adopting them in a controller is a non-breaking,
 * mechanical change (no client-visible difference).
 */

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface PaginationMeta {
  skip: number;
  take: number;
  total: number;
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
  pagination: { skip: number; take: number; total: number },
): PaginatedResponse<T> => ({
  success: true,
  data,
  pagination: {
    ...pagination,
    hasMore: pagination.skip + pagination.take < pagination.total,
  },
});
