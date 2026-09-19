export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: string;
  profileUrl?: string;
  profileImageUuid?: string;
  role: string;
  regionId?: string;
  organizationId?: string;
  branchId?: string;
  employeeId?: string;
  enabled: boolean;
  accountNonLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignupRequest {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: string;
  profileImageUuid?: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: string;
  profileUrl?: string;
  profileImageUuid?: string;
  roleId: string;
  regionId?: string;
  organizationId?: string;
  branchId?: string;
  employeeId?: string;
}

export interface UpdateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: string;
  profileUrl?: string;
  profileImageUuid: string;
  regionId?: string;
  organizationId?: string;
  branchId?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  type: string;
  user: User;
}

/** One login (device/browser) of the current user, as returned by GET /auth/sessions. */
export interface UserSession {
  sessionId: string;
  deviceLabel: string;
  ipAddress: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revoked: boolean;
  /** True only for the session making this request. */
  current: boolean;
}


export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface Role {
  id: string;
  roleName: string;
}
