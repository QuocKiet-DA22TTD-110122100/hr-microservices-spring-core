export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
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

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
