export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface AuthClaims {
  sub?: string;
  username?: string;
  email?: string;
  fullName?: string;
  roles?: string[] | string;
  permissions?: string[] | string;
  exp?: number;
  [key: string]: unknown;
}

export interface VerifyTokenResponse {
  valid: boolean;
  claims: AuthClaims;
}

export interface PermissionDescriptor {
  key: string;
  name: string;
  type: 'system' | 'custom' | 'role';
}


export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  passwordExpiresAt: string;
  isLocked: boolean;
  lockedUntil?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordApiRequest {
  username: string;
  oldPassword: string;
  newPassword: string;
}
