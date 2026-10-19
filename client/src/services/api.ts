import axios from 'axios';
import type { User, Gift, Payment, PaymentSettings, PlatformSettings } from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { username: string; email: string; password: string; confirmPassword: string; agreeTerms: boolean }) =>
    api.post<{ success: boolean; user: User }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ success: boolean; user: User }>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<{ authenticated: boolean; user?: User }>('/auth/me'),
};

// ── Gifts ─────────────────────────────────────────────────────────────────────
export const giftsApi = {
  list: () => api.get<{ success: boolean; gifts: Gift[] }>('/gifts'),

  get: (id: number) => api.get<{ success: boolean; gift: Gift }>(`/gifts/${id}`),

  getPublic: (slug: string) => api.get<{ success: boolean; gift: Gift }>(`/gifts/public/${slug}`),

  create: (data: Partial<Gift>) => api.post<{ success: boolean; gift: Gift }>('/gifts', data),

  update: (id: number, data: Partial<Gift>) => api.patch<{ success: boolean; gift: Gift }>(`/gifts/${id}`, data),

  delete: (id: number) => api.delete(`/gifts/${id}`),

  duplicate: (id: number) => api.post<{ success: boolean; gift: Gift }>(`/gifts/${id}/duplicate`),

  addMemory: (giftId: number, data: { imageUrl: string; title?: string; caption?: string; memoryDate?: string; sortOrder?: number }) =>
    api.post(`/gifts/${giftId}/memories`, data),

  deleteMemory: (giftId: number, memId: number) =>
    api.delete(`/gifts/${giftId}/memories/${memId}`),

  addTimeline: (giftId: number, data: { title: string; description?: string; eventDate?: string; imageUrl?: string; sortOrder?: number }) =>
    api.post(`/gifts/${giftId}/timeline`, data),

  deleteTimeline: (giftId: number, entryId: number) =>
    api.delete(`/gifts/${giftId}/timeline/${entryId}`),
};

// ── Uploads ───────────────────────────────────────────────────────────────────
export const uploadsApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ success: boolean; url: string; filename: string }>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
  getSettings: () => api.get<{ success: boolean; settings: PaymentSettings }>('/payments/settings'),

  getGiftPayment: (giftId: number) =>
    api.get<{ success: boolean; paymentStatus: string; payment: Payment }>(`/payments/gift/${giftId}`),

  submit: (data: { giftId: number; provider: 'instapay' | 'vodafone_cash'; transactionReference: string; receipt?: File }) => {
    const form = new FormData();
    form.append('giftId', String(data.giftId));
    form.append('provider', data.provider);
    form.append('transactionReference', data.transactionReference);
    if (data.receipt) form.append('receipt', data.receipt);
    return api.post('/payments/submit', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  gifts: () => api.get('/admin/gifts'),
  deleteGift: (id: number) => api.delete(`/admin/gifts/${id}`),
  payments: () => api.get<{ success: boolean; payments: Payment[] }>('/admin/payments'),
  approvePayment: (id: number, notes?: string) => api.post(`/admin/payments/${id}/approve`, { notes }),
  rejectPayment: (id: number, notes?: string) => api.post(`/admin/payments/${id}/reject`, { notes }),
  getSettings: () => api.get<{ success: boolean; settings: PlatformSettings }>('/admin/settings'),
  updateSettings: (settings: Partial<PlatformSettings>) => api.patch('/admin/settings', settings),
};

export default api;
