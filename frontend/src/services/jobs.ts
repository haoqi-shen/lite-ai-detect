import { api } from '../lib/api';
import type { Job } from '../types';
import { mockApi } from '../mock/mockApi';

const useMock = (import.meta as any).env?.VITE_USE_MOCK === 'true';

export async function createJobs(files: File[], lang?: string) {
  if (useMock) return mockApi.createJobs(files, lang);
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  const { data } = await api.post('/api/jobs/batch', form);
  return data as Job[];
}

export async function listJobs(params: { q?: string; status?: string[]; page?: number; page_size?: number }) {
  if (useMock) return mockApi.listJobs(params);
  const { data } = await api.get('/api/jobs', { params });
  return data;
}

export async function getJob(id: string) {
  if (useMock) return mockApi.getJob(id);
  const { data } = await api.get(`/api/jobs/${id}`);
  return data as Job;
}

export async function cancelJob(id: string) {
  if (useMock) return mockApi.cancelJob(id);
  await api.post(`/api/jobs/${id}/cancel`, {});
}

export async function rerunJob(id: string) {
  if (useMock) return mockApi.rerunJob(id);
  await api.post(`/api/jobs/${id}/rerun`, {});
}

export async function getDashboard() {
  if (useMock) return mockApi.dashboard();
  const { data } = await api.get('/api/dashboard');
  return data;
}


