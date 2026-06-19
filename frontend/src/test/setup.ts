import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

const optionalImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<Record<string, unknown>>;

void optionalImport('@testing-library/jest-dom/matchers')
  .then((matchers) => {
    expect.extend(matchers);
  })
  .catch(() => {
    // Some minimal installs do not include jest-dom; pure unit tests can still run.
  });

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;
