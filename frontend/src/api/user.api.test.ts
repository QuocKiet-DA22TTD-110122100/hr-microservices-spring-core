import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  ApiErrorCode,
  UserResponseMapper,
  extractErrorMessage,
  extractStatusCode,
  isRetryableError,
  mapStatusToErrorCode,
  normalizeDate,
  userApi,
} from './user.api';

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
const del = vi.fn();

vi.mock('@/utils/axios', () => ({
  default: {
    get,
    post,
    put,
    delete: del,
  },
}));

describe('user.api helpers', () => {
  it('maps HTTP status codes to api error codes', () => {
    expect(mapStatusToErrorCode()).toBe(ApiErrorCode.NETWORK_ERROR);
    expect(mapStatusToErrorCode(400)).toBe(ApiErrorCode.VALIDATION_ERROR);
    expect(mapStatusToErrorCode(401)).toBe(ApiErrorCode.UNAUTHORIZED);
    expect(mapStatusToErrorCode(403)).toBe(ApiErrorCode.FORBIDDEN);
    expect(mapStatusToErrorCode(404)).toBe(ApiErrorCode.NOT_FOUND);
    expect(mapStatusToErrorCode(409)).toBe(ApiErrorCode.CONFLICT);
    expect(mapStatusToErrorCode(500)).toBe(ApiErrorCode.SERVER_ERROR);
    expect(mapStatusToErrorCode(418)).toBe(ApiErrorCode.UNKNOWN_ERROR);
  });

  it('extracts error message and status code from axios-like errors', () => {
    const error = {
      message: 'fallback message',
      response: {
        status: 422,
        data: { message: 'validation failed' },
      },
    };

    expect(extractStatusCode(error)).toBe(422);
    expect(extractErrorMessage(error)).toBe('validation failed');
  });

  it('falls back to error message when response data is missing', () => {
    const error = { message: 'network down' };
    expect(extractErrorMessage(error)).toBe('network down');
    expect(extractStatusCode(error)).toBeUndefined();
  });

  it('identifies retryable errors', () => {
    expect(isRetryableError(new ApiError(ApiErrorCode.SERVER_ERROR, 'server', undefined, 503))).toBe(true);
    expect(isRetryableError({ message: 'timeout', code: 'ECONNABORTED' })).toBe(true);
    expect(isRetryableError({ response: { status: 404 } })).toBe(false);
  });

  it('normalizes dates and maps user payloads', () => {
    expect(normalizeDate('invalid-date')).toBeUndefined();

    const user = UserResponseMapper.toUserAccount({
      id: 'u-1',
      username: 'alice',
      role: 'USER',
      locked: 0,
      createdAt: '2026-01-02T03:04:05.000Z',
    });

    expect(user).toMatchObject({
      id: 'u-1',
      username: 'alice',
      role: 'USER',
      locked: false,
    });
    expect(user.createdAt).toBeDefined();

    const fromRegister = UserResponseMapper.fromRegisterResponse({
      userId: 'u-2',
      username: 'bob',
      role: 'ADMIN',
    });

    expect(fromRegister).toMatchObject({
      id: 'u-2',
      username: 'bob',
      role: 'ADMIN',
      locked: false,
    });
  });
});

describe('user.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retries retryable failures and eventually succeeds', async () => {
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback: TimerHandler) => {
      if (typeof callback === 'function') callback();
      return 0 as never;
    }) as typeof setTimeout);

    get
      .mockRejectedValueOnce({ response: { status: 503, data: { message: 'temporary' } } })
      .mockResolvedValueOnce({ data: [] });

    const result = await userApi.getAll();

    expect(result.success).toBe(true);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid create payloads before calling the api', async () => {
    await expect(userApi.create({ username: '', password: 'secret', role: 'USER' })).rejects.toMatchObject({
      code: ApiErrorCode.VALIDATION_ERROR,
    });
    expect(post).not.toHaveBeenCalled();
  });
});