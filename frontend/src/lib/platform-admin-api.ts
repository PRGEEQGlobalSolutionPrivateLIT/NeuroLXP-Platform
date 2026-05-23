import { platformApiClient as apiClient } from '@/platform-admin/lib/axios';

export type PlatformAdminProfile = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  primaryEmail: string;
  primaryPhone: string;
  alternativeEmail: string;
  alternativePhone: string;
  userId: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  role: string;
};

export const platformAdminApi = {
  getProfile: () => apiClient.get<PlatformAdminProfile>('/api/platform-admin/me'),

  updateProfile: (data: {
    fullName?: string;
    primaryPhone?: string;
    alternativeEmail?: string;
    alternativePhone?: string;
  }) => apiClient.patch('/api/platform-admin/me', data),

  invite: (data: {
    fullName: string;
    dateOfBirth: string;
    primaryEmail: string;
    primaryPhone: string;
    password: string;
    createdBySuperAdminId?: string;
  }) => apiClient.post('/api/platform-admin/invite', data),

  signup: (data: {
    fullName: string;
    dateOfBirth: string;
    primaryEmail: string;
    primaryPhone: string;
    password: string;
  }) => apiClient.post('/api/platform-admin/signup', data),

  consumeMagicLink: (token: string, email: string) =>
    apiClient.post('/api/platform-admin/magic-link/consume', { token, email }),

  onboardingStatus: (sessionId: string) =>
    apiClient.get(`/api/platform-admin/onboarding/status/${sessionId}`),

  resetPassword: (sessionId: string, newPassword: string) =>
    apiClient.post(`/api/platform-admin/onboarding/reset-password/${sessionId}`, { newPassword }),

  totpSetup: (sessionId: string) =>
    apiClient.post(`/api/platform-admin/onboarding/totp/setup/${sessionId}`),

  totpVerify: (sessionId: string, code: string) =>
    apiClient.post(`/api/platform-admin/onboarding/totp/verify/${sessionId}`, { code }),

  setAltContact: (
    sessionId: string,
    data: { altEmail: string; altPhone: string; emailVerified: boolean; phoneVerified: boolean },
  ) => apiClient.post(`/api/platform-admin/onboarding/alt-contact/${sessionId}`, data),

  completeOnboarding: (sessionId: string) =>
    apiClient.post(`/api/platform-admin/onboarding/complete/${sessionId}`),

  primarySignin: (identifier: string, password: string) =>
    apiClient.post('/api/platform-admin/signin/primary', { identifier, password }),

  sendOtp: (sessionId: string, method: 'email' | 'phone', channel: 'primary' | 'alt') =>
    apiClient.post(`/api/platform-admin/signin/otp/send/${sessionId}`, { method, channel }),

  verifyOtp: (sessionId: string, method: 'email' | 'phone', otp: string, channel: 'primary' | 'alt') =>
    apiClient.post(`/api/platform-admin/signin/otp/verify/${sessionId}`, { method, otp, channel }),

  totp: (sessionId: string, code: string) =>
    apiClient.post(`/api/platform-admin/signin/totp/${sessionId}`, { code }),

  recovery: (sessionId: string, code: string) =>
    apiClient.post(`/api/platform-admin/signin/recovery/${sessionId}`, { code }),

  requestApproval: (sessionId: string) =>
    apiClient.post(`/api/platform-admin/signin/approval/request/${sessionId}`),

  checkApproval: (sessionId: string) =>
    apiClient.post(`/api/platform-admin/signin/approval/check/${sessionId}`),

  listPendingApprovals: () => apiClient.get('/api/platform-admin/approvals/pending'),

  approveRequest: (requestId: string) =>
    apiClient.post(`/api/platform-admin/approvals/${requestId}/approve`),

  listInstitutionPendingApprovals: () =>
    apiClient.get('/api/platform-admin/institution-approvals/pending'),

  approveInstitutionRequest: (requestId: string) =>
    apiClient.post(`/api/platform-admin/institution-approvals/${requestId}/approve`),
};
