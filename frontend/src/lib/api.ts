import { apiClient } from '@/superadmin/lib/axios';

export const signupApi = {
  initialize: () => apiClient.post('/api/auth/signup/initialize'),
  step1: (sessionId: string, data: { fullName: string; dateOfBirth: string }) =>
    apiClient.post(`/api/auth/signup/step1/${sessionId}`, data),
  sendOtp: (sessionId: string, identifier: string, type: 'email' | 'sms' | 'phone') =>
    apiClient.post(`/api/auth/signup/send-otp/${sessionId}`, { identifier, type }),
  verifyOtp: (sessionId: string, identifier: string, type: 'email' | 'sms' | 'phone', otp: string, field: string) =>
    apiClient.post(`/api/auth/signup/verify-otp/${sessionId}`, { identifier, type, otp, field }),
  step2: (sessionId: string, data: { primaryEmail: string; primaryPhone: string; emailVerified: boolean; phoneVerified: boolean }) =>
    apiClient.post(`/api/auth/signup/step2/${sessionId}`, data),
  password: (sessionId: string, password: string) =>
    apiClient.post(`/api/auth/signup/password/${sessionId}`, { password }),
  userId: (sessionId: string) => apiClient.post(`/api/auth/signup/user-id/${sessionId}`),
  altContact: (sessionId: string, data: { altEmail: string; altPhone: string; emailVerified: boolean; phoneVerified: boolean }) =>
    apiClient.post(`/api/auth/signup/alt-contact/${sessionId}`, data),
  totpSetup: (sessionId: string) => apiClient.post(`/api/auth/signup/totp/setup/${sessionId}`),
  totpVerify: (sessionId: string, code: string) =>
    apiClient.post(`/api/auth/signup/totp/verify/${sessionId}`, { code }),
  recoveryCode: (sessionId: string) => apiClient.post(`/api/auth/signup/recovery-code/${sessionId}`),
  securityCodes: (sessionId: string) => apiClient.post(`/api/auth/signup/security-codes/${sessionId}`),
  identity: (sessionId: string, data: { selfieBase64: string; govtIdType: string; govtIdNumber: string }) =>
    apiClient.post(`/api/auth/signup/identity/${sessionId}`, data),
  securityQA: (sessionId: string, data: Record<string, string>) =>
    apiClient.post(`/api/auth/signup/security-qa/${sessionId}`, data),
  declarations: (sessionId: string, declarations: Record<string, boolean>) =>
    apiClient.post(`/api/auth/signup/declarations/${sessionId}`, { declarations }),
  review: (sessionId: string) => apiClient.get(`/api/auth/signup/review/${sessionId}`),
  complete: (sessionId: string) => apiClient.post(`/api/auth/signup/complete/${sessionId}`),
};

export const signinApi = {
  primary: (identifier: string, password: string) =>
    apiClient.post('/api/auth/signin/primary', { identifier, password }),
  forgotPassword: (identifier: string, newPassword: string, otp: string) =>
    apiClient.post('/api/auth/signin/forgot-password', { identifier, newPassword, otp }),
  sendOtp: (sessionId: string, method: 'email' | 'phone', channel: 'primary' | 'alt') =>
    apiClient.post(`/api/auth/signin/otp/send/${sessionId}`, { method, channel }),
  verifyOtp: (sessionId: string, method: 'email' | 'phone', otp: string, channel: 'primary' | 'alt') =>
    apiClient.post(`/api/auth/signin/otp/verify/${sessionId}`, { method, otp, channel }),
  totp: (sessionId: string, code: string) =>
    apiClient.post(`/api/auth/signin/totp/${sessionId}`, { code }),
  recovery: (sessionId: string, code: string) =>
    apiClient.post(`/api/auth/signin/recovery/${sessionId}`, { code }),
  recoveryAck: (sessionId: string) => apiClient.post(`/api/auth/signin/recovery/ack/${sessionId}`),
  securityCode: (sessionId: string, code: string) =>
    apiClient.post(`/api/auth/signin/security-code/${sessionId}`, { code }),
  govtId: (sessionId: string, idNumber: string) =>
    apiClient.post(`/api/auth/signin/govt-id/${sessionId}`, { idNumber }),
  securityQuestions: (superAdminId: string) =>
    apiClient.get(`/api/auth/signin/security-questions/${superAdminId}`),
  verifySecurityQuestions: (sessionId: string, answers: { a1: string; a2: string; a3: string }) =>
    apiClient.post(`/api/auth/signin/security-questions/${sessionId}`, answers),
  requestApproval: (sessionId: string) =>
    apiClient.post(`/api/auth/signin/approval/request/${sessionId}`),
  verifyApproval: (sessionId: string, code: string) =>
    apiClient.post(`/api/auth/signin/approval/verify/${sessionId}`, { code }),
};
