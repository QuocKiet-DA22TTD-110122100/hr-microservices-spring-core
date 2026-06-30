import { describe, expect, it } from 'vitest';
import { getNotificationClasses } from './notificationClasses';

describe('getNotificationClasses', () => {
  it('returns the success classes', () => {
    expect(getNotificationClasses('success')).toContain('bg-green-50');
  });

  it('returns the fallback info classes', () => {
    expect(getNotificationClasses('info')).toContain('bg-blue-50');
  });
});