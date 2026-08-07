import { useState } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export function usePagination(options?: UsePaginationOptions) {
  const [page, setPage] = useState(options?.initialPage ?? 1);
  const [limit, setLimit] = useState(options?.initialLimit ?? 10);

  const goToPage = (newPage: number) => setPage(Math.max(1, newPage));
  const goToNextPage = () => setPage((p) => p + 1);
  const goToPrevPage = () => setPage((p) => Math.max(1, p - 1));
  const setPageSize = (newLimit: number) => {
    setLimit(Math.max(1, newLimit));
    setPage(1); // Reset to first page on limit change
  };

  return {
    page,
    limit,
    goToPage,
    goToNextPage,
    goToPrevPage,
    setPageSize,
  };
}
