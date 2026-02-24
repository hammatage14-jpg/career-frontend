/**
 * IAS API Service Layer
 * ─────────────────────────────────────────────────────────────────
 * All backend communication is centralised here.
 * Components never make direct fetch/axios calls — they use these
 * service functions. This means swapping your backend URL or auth
 * strategy only requires changes in this file.
 *
 * Base URL is read from VITE_API_URL in your .env.local file.
 * In development, Vite proxies /api/* to that URL (see vite.config.js).
 */

import axios from 'axios'

// In production, use full backend URL so /api requests hit your server (not the frontend host).
// In dev, use /api and Vite proxy forwards to VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// ─── Request interceptor — attach auth token; allow FormData to set Content-Type ───────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ias_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// ─── Response interceptor — handle 401 globally ───────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('ias_token')
      localStorage.removeItem('ias_token')
      // Only redirect if we had a token (session expired). Avoids reload loop when /auth/me returns 401 with no token.
      if (hadToken) {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════
export const authService = {
  register:        (data)        => api.post('/auth/register', data),
  login:           (credentials) => api.post('/auth/login', credentials),
  loginGoogle:     (idToken, role) => api.post('/auth/google', { idToken, role }),
  logout:          ()            => api.post('/auth/logout'),
  me:              ()            => api.get('/auth/me'),
  refresh:         ()            => api.post('/auth/refresh'),
  forgotPassword:    (email)       => api.post('/auth/forgot-password', { email }),
  resetPassword:     (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail:       (email, otp)  => api.post('/auth/verify-email', { email, otp }),
  resendVerification: (email)      => api.post('/auth/resend-verification', email ? { email } : {}),
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
export const dashboardService = {
  getStats:    ()       => api.get('/dashboard/stats'),
  getActivity: (limit) => api.get('/dashboard/activity', { params: { limit } }),
}

// ══════════════════════════════════════════════════════════════
// OPPORTUNITIES
// ══════════════════════════════════════════════════════════════
export const opportunityService = {
  getAll:       (params) => api.get('/opportunities', { params }),
  getById:      (id)     => api.get(`/opportunities/${id}`),
  getRecommended: ()    => api.get('/opportunities/recommended'),
  save:         (id)     => api.post(`/opportunities/${id}/save`),
  unsave:       (id)     => api.delete(`/opportunities/${id}/save`),
  getSaved:     ()       => api.get('/opportunities/saved'),
  getAdminAll:  (params) => api.get('/opportunities/admin/all', { params }),
  create:       (data)   => api.post('/opportunities', data),
  update:       (id, d)  => api.patch(`/opportunities/${id}`, d),
}

// ══════════════════════════════════════════════════════════════
// APPLICATIONS
// ══════════════════════════════════════════════════════════════
export const applicationService = {
  getAll:       (params) => api.get('/applications', { params }),
  getById:     (id)     => api.get(`/applications/${id}`),
  create:      (payload) => {
    if (payload instanceof FormData) {
      return api.post('/applications', payload, { headers: { 'Content-Type': undefined } });
    }
    const form = new FormData();
    if (payload.opportunityId != null) form.append('opportunityId', payload.opportunityId);
    if (payload.coverLetter != null) form.append('coverLetter', payload.coverLetter);
    const resumeFile = payload.resume;
    if (resumeFile && (resumeFile instanceof File || resumeFile instanceof Blob)) {
      form.append('resume', resumeFile, resumeFile instanceof File ? resumeFile.name : 'resume');
    }
    if (payload.recommendationLetter && (payload.recommendationLetter instanceof File || payload.recommendationLetter instanceof Blob)) {
      form.append('recommendationLetter', payload.recommendationLetter, payload.recommendationLetter instanceof File ? payload.recommendationLetter.name : 'recommendation');
    }
    return api.post('/applications', form, { headers: { 'Content-Type': undefined } });
  },
  pay:         (id) => api.post(`/applications/${id}/pay`),
  chargeMpesa: (id, phone) => api.post(`/applications/${id}/charge-mpesa`, { phone }),
  update:      (id, d)  => api.patch(`/applications/${id}`, d),
  withdraw:    (id)     => api.delete(`/applications/${id}`),
  verifyPayment: (reference) => api.post('/applications/verify-payment', { reference }),
  chargeSavedCard: (id) => api.post(`/applications/${id}/charge-saved-card`),
  getAllAdmin: (params) => api.get('/applications/admin/all', { params }),
  updateStatusAdmin: (id, status) => api.patch(`/applications/admin/${id}/status`, { status }),
  refundAdmin: (id, reason) => api.post(`/applications/admin/${id}/refund`, { reason }),
  transferMpesaAdmin: (data) => api.post('/applications/admin/transfer-mpesa', data),
}

// ══════════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════════
export const profileService = {
  get:    ()       => api.get('/profile'),
  update: (data)   => api.patch('/profile', data),
  uploadCV: (file) => {
    const form = new FormData()
    form.append('cv', file)
    return api.post('/profile/cv', form)
  },
}

// ══════════════════════════════════════════════════════════════
// MESSAGES
// ══════════════════════════════════════════════════════════════
export const messageService = {
  getAll:  ()          => api.get('/messages'),
  getById: (id)        => api.get(`/messages/${id}`),
  send:    (data)      => api.post('/messages', data),
  markRead:(id)        => api.patch(`/messages/${id}/read`),
}

export default api
