import type { ApiError, ApiMeta, ApiResponse } from '@aura/shared';

/** Build a successful API envelope. */
export function success<T>(
  data: T,
  message = 'OK',
  meta: ApiMeta | null = null,
): ApiResponse<T> {
  return { status: 'success', message, data, errors: null, meta };
}

/** Build an error API envelope. */
export function failure(
  message: string,
  errors: ApiError[] | null = null,
  meta: ApiMeta | null = null,
): ApiResponse<null> {
  return { status: 'error', message, data: null, errors, meta };
}
