import { useMemo, useState } from 'react';

interface UsePaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

export function usePagination<T>(items: T[], { pageSize = 10, initialPage = 1 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    page: currentPage,
    pageCount,
    pageSize,
    pageItems,
    hasNextPage: currentPage < pageCount,
    hasPreviousPage: currentPage > 1,
    nextPage: () => setPage((p) => Math.min(p + 1, pageCount)),
    previousPage: () => setPage((p) => Math.max(p - 1, 1)),
    setPage,
  };
}
