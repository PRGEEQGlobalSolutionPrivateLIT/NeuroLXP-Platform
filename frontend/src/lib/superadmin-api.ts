import { apiClient } from '@/superadmin/lib/axios';

export type SuperAdminProfile = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  primaryEmail: string;
  primaryPhone: string;
  alternativeEmail: string;
  alternativePhone: string;
  userId: string;
  approverName: string;
  approverDesignation: string;
  approverEmail: string;
  approverPhone: string;
  isActive: boolean;
  signupCompleted: boolean;
  role: string;
};

export type PlatformAdminApproval = {
  id: string;
  platform_admin: { full_name: string; primary_email: string; user_id: string | null };
};

export type InstitutionAdminApproval = {
  id: string;
  institution_admin: { full_name: string; primary_email: string; user_id: string | null };
};

export const superAdminApi = {
  getProfile: () => apiClient.get<SuperAdminProfile>('/api/auth/me'),

  updateProfile: (data: {
    fullName?: string;
    primaryPhone?: string;
    alternativeEmail?: string;
    alternativePhone?: string;
    approverName?: string;
    approverDesignation?: string;
    approverEmail?: string;
    approverPhone?: string;
  }) => apiClient.patch('/api/auth/me', data),

  listPlatformAdminApprovals: () =>
    apiClient.get<PlatformAdminApproval[]>('/api/platform-admin/approvals/pending'),

  approvePlatformAdmin: (requestId: string) =>
    apiClient.post(`/api/platform-admin/approvals/${requestId}/approve`),

  listInstitutionAdminApprovals: () =>
    apiClient.get<InstitutionAdminApproval[]>('/api/platform-admin/institution-approvals/pending'),

  approveInstitutionAdmin: (requestId: string) =>
    apiClient.post(`/api/platform-admin/institution-approvals/${requestId}/approve`),
};
