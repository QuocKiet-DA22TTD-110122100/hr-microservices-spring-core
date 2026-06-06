import { AuthClaims, User } from '@/types/auth';

export const AUTH_STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'user',
} as const;

export const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const toStringClaim = (value: unknown, fallback: string): string => {
  return typeof value === 'string' && value.trim() ? value : fallback;
};

export const mapClaimsToUser = (claims: AuthClaims, fallbackUsername: string): User => {
  const username = toStringClaim(claims.username ?? claims.sub, fallbackUsername);
  const roles = toStringArray(claims.roles ?? claims.role);
  const permissions = toStringArray(claims.permissions);
  const passwordExpiresAt =
    typeof claims.passwordExpiresAt === 'string'
      ? claims.passwordExpiresAt
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: toStringClaim(claims.userId ?? claims.sub, username),
    username,
    email: toStringClaim(claims.email, `${username}@company.com`),
    fullName: toStringClaim(claims.fullName, username),
    roles,
    permissions,
    passwordExpiresAt,
    isLocked: Boolean(claims.isLocked),
  };
};

export const isJwtExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const [, payload] = token.split('.');
    if (!payload) return false;

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(globalThis.atob(normalizedPayload)) as { exp?: number };

    if (!decoded.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};
