import axios from 'axios';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

export type MemberRole = 'coordinator' | 'faculty' | 'student';
export type ApproverRole = 'coordinator' | 'institution_admin';

export type CsvRowPayload = {
  rowIndex: number;
  fullName: string;
  email: string;
  phone: string;
  department?: string;
  employeeId?: string;
  extra?: Record<string, string>;
};

export const membersApi = {
  validateCsv: (role: MemberRole, rows: CsvRowPayload[]) =>
    client.post('/api/members/validate-csv', { role, rows }),

  inviteSingle: (data: {
    role: MemberRole;
    fullName: string;
    email: string;
    createdByType?: string;
    createdById?: string;
  }) => client.post('/api/members/invite/single', data),

  inviteBulk: (data: {
    role: MemberRole;
    rows: CsvRowPayload[];
    createdByType?: string;
    createdById?: string;
    fileName?: string;
    tenantId?: string;
    tenantName?: string;
  }) =>
    client.post<{
      bulkUploadId: string;
      total: number;
      succeeded: number;
      failed: number;
      credentials?: {
        rowIndex: number;
        fullName: string;
        email: string;
        userId?: string;
        tempPassword: string;
        magicLink: string;
        memberId: string;
      }[];
      results?: {
        rowIndex: number;
        email: string;
        success: boolean;
        error?: string;
        reinvited?: boolean;
        userId?: string;
        tempPassword?: string;
        magicLink?: string;
      }[];
    }>('/api/members/invite/bulk', data),

  listRecentBulkUploads: (uploadedByType?: string) =>
    client.get<BulkUploadSummary[]>('/api/members/bulk-uploads/recent', {
      params: uploadedByType ? { uploadedByType } : undefined,
    }),

  getBulkUploadCredentials: (bulkUploadId: string) =>
    client.get<BulkUploadCredentials>(`/api/members/bulk-uploads/${bulkUploadId}/credentials`),

  consumeMagic: (token: string, email: string, role: MemberRole) =>
    client.post('/api/members/magic-link/consume', { token, email, role }),

  primarySignin: (identifier: string, password: string, role: MemberRole) =>
    client.post('/api/members/signin/primary', { identifier, password, role }),

  totpSignin: (sessionId: string, code: string) =>
    client.post(`/api/members/signin/totp/${sessionId}`, { code }),

  recoverySignin: (sessionId: string, code: string) =>
    client.post(`/api/members/signin/recovery/${sessionId}`, { code }),

  requestApproval: (sessionId: string) =>
    client.post(`/api/members/signin/approval/request/${sessionId}`),

  checkApproval: (sessionId: string) =>
    client.post(`/api/members/signin/approval/check/${sessionId}`),

  listPendingApprovals: (approverRole: ApproverRole) =>
    client.get('/api/members/approvals/pending', { params: { approverRole } }),

  approveMemberRequest: (requestId: string) =>
    client.post(`/api/members/approvals/${requestId}/approve`),

  forgotStart: (identifier: string, role: MemberRole) =>
    client.post('/api/members/forgot-password/start', { identifier, role }),

  forgotSetPassword: (sessionId: string, newPassword: string, confirmPassword: string) =>
    client.post(`/api/members/forgot-password/set/${sessionId}`, { newPassword, confirmPassword }),

  forgotSendOtp: (sessionId: string) => client.post(`/api/members/forgot-password/otp/send/${sessionId}`),

  forgotVerifyOtp: (sessionId: string, otp: string) =>
    client.post(`/api/members/forgot-password/otp/verify/${sessionId}`, { otp }),

  onboardingPassword: (sessionId: string, newPassword: string, confirmPassword: string) =>
    client.post(`/api/members/onboarding/password/${sessionId}`, { newPassword, confirmPassword }),

  totpSetup: (sessionId: string) => client.post(`/api/members/onboarding/totp/setup/${sessionId}`),

  totpVerify: (sessionId: string, code: string) =>
    client.post(`/api/members/onboarding/totp/verify/${sessionId}`, { code }),

  completeOnboarding: (sessionId: string) => client.post(`/api/members/onboarding/complete/${sessionId}`),

  changePassword: (memberId: string, newPassword: string) =>
    client.post(`/api/members/change-password/${memberId}`, { newPassword }),

  getProfile: (memberId: string) => client.get(`/api/members/profile/${memberId}`),

  updateProfile: (
    memberId: string,
    data: {
      fullName?: string;
      phone?: string;
      department?: string;
      employeeId?: string;
      studentSupplement?: Record<string, string>;
    },
  ) => client.post(`/api/members/profile/${memberId}`, data),
};

export type MemberProfileResponse = {
  id: string;
  role: MemberRole;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
  employeeId: string | null;
  userId: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
  csvProfile?: Record<string, string>;
  studentSupplement?: Record<string, string>;
  onboardingCompleted: boolean;
  mustChangePassword?: boolean;
  hasTotp?: boolean;
};

export type BulkUploadSummary = {
  id: string;
  role: MemberRole;
  tenant_name: string | null;
  file_name: string | null;
  total_rows: number;
  succeeded: number;
  failed: number;
  created_at: string;
};

export type BulkUploadCredentials = {
  id: string;
  role: MemberRole;
  tenantId: string | null;
  tenantName: string | null;
  fileName: string | null;
  totalRows: number;
  succeeded: number;
  failed: number;
  createdAt: string;
  failures?: { rowIndex: number; email: string; error: string }[];
  credentials: {
    id: string;
    rowIndex: number;
    fullName: string;
    email: string;
    userId: string | null;
    tempPassword: string;
    magicLink: string;
    emailSent: boolean;
  }[];
};
