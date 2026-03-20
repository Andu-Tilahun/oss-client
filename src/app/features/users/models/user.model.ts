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
