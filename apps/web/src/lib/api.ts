import type { ApiResponse, HealthStatus } from '@aura/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

/** Fetch the backend health status. */
export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  const body = (await res.json()) as ApiResponse<HealthStatus>;
  if (body.status !== 'success' || !body.data) {
    throw new Error(body.message || 'Unexpected response');
  }
  return body.data;
}
