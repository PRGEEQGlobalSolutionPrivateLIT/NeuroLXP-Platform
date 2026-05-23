import { institutionApiClient as apiClient } from '@/institution-admin/lib/axios';

export type InstitutionAdminProfile = {
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

export const institutionAdminApi = {
  getProfile: () => apiClient.get<InstitutionAdminProfile>('/api/institution-admin/me'),

  updateProfile: (data: {
    fullName?: string;
    primaryPhone?: string;
    alternativeEmail?: string;
    alternativePhone?: string;
  }) => apiClient.patch('/api/institution-admin/me', data),

  invite: (data: {
    fullName: string;
    dateOfBirth: string;
    primaryEmail: string;
    primaryPhone: string;
    password: string;
    createdByPlatformAdminId?: string;
  }) => apiClient.post('/api/institution-admin/invite', data),

  consumeMagicLink: (token: string, email: string) =>
    apiClient.post('/api/institution-admin/magic-link/consume', { token, email }),

  onboardingStatus: (sessionId: string) =>
    apiClient.get(`/api/institution-admin/onboarding/status/${sessionId}`),

  resetPassword: (sessionId: string, newPassword: string) =>
    apiClient.post(`/api/institution-admin/onboarding/reset-password/${sessionId}`, { newPassword }),

  totpSetup: (sessionId: string) =>
    apiClient.post(`/api/institution-admin/onboarding/totp/setup/${sessionId}`),

  totpVerify: (sessionId: string, code: string) =>
    apiClient.post(`/api/institution-admin/onboarding/totp/verify/${sessionId}`, { code }),

  setAltContact: (
    sessionId: string,
    data: { altEmail: string; altPhone: string; emailVerified: boolean; phoneVerified: boolean },
  ) => apiClient.post(`/api/institution-admin/onboarding/alt-contact/${sessionId}`, data),

  completeOnboarding: (sessionId: string) =>
    apiClient.post(`/api/institution-admin/onboarding/complete/${sessionId}`),

  primarySignin: (identifier: string, password: string) =>
    apiClient.post('/api/institution-admin/signin/primary', { identifier, password }),

  sendOtp: (sessionId: string, method: 'email' | 'phone', channel: 'primary' | 'alt') =>
    apiClient.post(`/api/institution-admin/signin/otp/send/${sessionId}`, { method, channel }),

  verifyOtp: (sessionId: string, method: 'email' | 'phone', otp: string, channel: 'primary' | 'alt') =>
    apiClient.post(`/api/institution-admin/signin/otp/verify/${sessionId}`, { method, otp, channel }),

  totp: (sessionId: string, code: string) =>
    apiClient.post(`/api/institution-admin/signin/totp/${sessionId}`, { code }),

  recovery: (sessionId: string, code: string) =>
    apiClient.post(`/api/institution-admin/signin/recovery/${sessionId}`, { code }),

  requestApproval: (sessionId: string) =>
    apiClient.post(`/api/institution-admin/signin/approval/request/${sessionId}`),

  checkApproval: (sessionId: string) =>
    apiClient.post(`/api/institution-admin/signin/approval/check/${sessionId}`),
};
