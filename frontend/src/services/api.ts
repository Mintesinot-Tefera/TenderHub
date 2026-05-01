import axios, { AxiosError } from 'axios';
import type {
  AuthResult,
  User,
  UserRole,
  UpdateProfilePayload,
  Category,
  PaginatedTenders,
  Tender,
  TenderFilters,
  CreateTenderPayload,
  UpdateTenderPayload,
  Bid,
  BidWithTender,
  BidWithBidder,
  DiscussionThread,
  ApiError,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'tender_token';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiError>;
    return axiosErr.response?.data?.error?.message || axiosErr.message;
  }
  return err instanceof Error ? err.message : 'An unexpected error occurred';
};

// --- Token management ---
export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// --- Auth ---
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    companyName?: string;
    phone?: string;
  }) => api.post<{ message: string }>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResult>('/auth/login', data).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),

  updateProfile: (data: UpdateProfilePayload) =>
    api.patch<User>('/auth/profile', data).then((r) => r.data),

  verifyEmail: (token: string) =>
    api.get<AuthResult>('/auth/verify-email', { params: { token } }).then((r) => r.data),

  resendVerification: (email: string) =>
    api.post<{ message: string }>('/auth/resend-verification', { email }).then((r) => r.data),

  googleAuth: (idToken: string, role?: UserRole) =>
    api.post<AuthResult>('/auth/google', { idToken, role }).then((r) => r.data),
};

// --- Categories ---
export const categoryApi = {
  list: () => api.get<Category[]>('/categories').then((r) => r.data),
};

// --- Tenders ---
export const tenderApi = {
  list: (filters: TenderFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.status) params.set('status', filters.status);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    return api.get<PaginatedTenders>(`/tenders?${params}`).then((r) => r.data);
  },

  getById: (id: string) => api.get<Tender>(`/tenders/${id}`).then((r) => r.data),

  myTenders: () => api.get<Tender[]>('/tenders/my').then((r) => r.data),

  create: (data: CreateTenderPayload) =>
    api.post<Tender>('/tenders', data).then((r) => r.data),

  update: (id: string, data: UpdateTenderPayload) =>
    api.patch<Tender>(`/tenders/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, action: 'close' | 'cancel') =>
    api.patch<Tender>(`/tenders/${id}/status`, { action }).then((r) => r.data),
};

// --- Bids ---
export interface BidPayload {
  amount: number;
  proposal: string;
  deliveryDays: number;
  document?: File | null;
}

function buildBidFormData(data: BidPayload): FormData {
  const formData = new FormData();
  formData.append('amount', String(data.amount));
  formData.append('proposal', data.proposal);
  formData.append('deliveryDays', String(data.deliveryDays));
  if (data.document) {
    formData.append('document', data.document);
  }
  return formData;
}

export const bidApi = {
  submit: (tenderId: string, data: BidPayload) => {
    const formData = buildBidFormData(data);
    return api
      .post<Bid>(`/tenders/${tenderId}/bids`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  myBids: () => api.get<BidWithTender[]>('/bids/my').then((r) => r.data),

  update: (bidId: string, data: BidPayload) => {
    const formData = buildBidFormData(data);
    return api
      .patch<Bid>(`/bids/${bidId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  withdraw: (bidId: string) =>
    api.delete<Bid>(`/bids/${bidId}`).then((r) => r.data),

  getTenderBids: (tenderId: string) =>
    api.get<BidWithBidder[]>(`/tenders/${tenderId}/bids`).then((r) => r.data),

  review: (bidId: string, action: 'under_review' | 'accept' | 'reject') =>
    api.patch<Bid>(`/bids/${bidId}/review`, { action }).then((r) => r.data),
};

// --- Discussions ---
export const discussionApi = {
  listForTender: (tenderId: string) =>
    api.get<DiscussionThread[]>(`/tenders/${tenderId}/discussions`).then((r) => r.data),

  post: (tenderId: string, data: { content: string; parentId?: string }) =>
    api.post(`/tenders/${tenderId}/discussions`, data).then((r) => r.data),
};
