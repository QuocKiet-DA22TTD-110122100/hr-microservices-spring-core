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
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const uniqueValues = (values: string[]): string[] => Array.from(new Set(values));

export const toStringClaim = (value: unknown, fallback: string): string => {
  return typeof value === 'string' && value.trim() ? value : fallback;
};

export const mapClaimsToUser = (claims: AuthClaims, fallbackUsername: string): User => {
  const username = toStringClaim(claims.username ?? claims.sub, fallbackUsername);
  const roles = uniqueValues([
    ...toStringArray(claims.roles),
    ...toStringArray(claims.role),
    ...toStringArray(claims.authorities).filter((value) => value.toUpperCase().startsWith('ROLE_')),
  ]).map((role) => role.replace(/^ROLE_/i, '').toUpperCase());
  const permissions = uniqueValues([
    ...toStringArray(claims.permissions),
    ...toStringArray(claims.scope),
    ...toStringArray(claims.scopes),
    ...toStringArray(claims.authorities).filter((value) => !value.toUpperCase().startsWith('ROLE_')),
  ]);
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

export const decodeJwtClaims = (token: string): AuthClaims => {
  const [, payload] = token.split('.');
  if (!payload) {
    throw new Error('Token không hợp lệ.');
  }

  const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
  const paddedPayload = normalizedPayload.padEnd(
    normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
    '='
  );

  return JSON.parse(globalThis.atob(paddedPayload)) as AuthClaims;
};

export const isJwtExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const decoded = decodeJwtClaims(token);

    if (!decoded.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};
