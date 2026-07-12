import { DashboardMetrics, Repository, Review, AnalyticsData } from '@/types';

const API_BASE = '/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  getDashboard: () => fetchAPI<DashboardMetrics>('/dashboard'),

  getRepos: () => fetchAPI<Repository[]>('/repos'),

  connectRepo: (fullName: string) =>
    fetchAPI<Repository>('/repos', {
      method: 'POST',
      body: JSON.stringify({ fullName }),
    }),

  disconnectRepo: (id: string) =>
    fetchAPI<void>(`/repos/${id}`, { method: 'DELETE' }),

  getReviews: () => fetchAPI<Review[]>('/reviews'),

  getReview: (id: string) => fetchAPI<Review>(`/reviews/${id}`),

  triggerReview: (prId: string) =>
    fetchAPI<Review>('/reviews/trigger', {
      method: 'POST',
      body: JSON.stringify({ prId }),
    }),

  getAnalytics: () => fetchAPI<AnalyticsData>('/analytics'),

  runSecurityScan: (repoId: string) =>
    fetchAPI<{ scanId: string }>('/security/scan', {
      method: 'POST',
      body: JSON.stringify({ repoId }),
    }),
};
