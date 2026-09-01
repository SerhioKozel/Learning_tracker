import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { timeAgo } from '../../src/utils/date';

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime('2026-09-01T12:00:00Z');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "just now" for less than 60 seconds', () => {
    const date = new Date('2026-09-01T11:59:30Z'); // 30 seconds ago
    expect(timeAgo(date)).toBe('just now');
  });

  it('should return "just now" for exactly 0 seconds', () => {
    const now = new Date('2026-09-01T12:00:00Z');
    expect(timeAgo(now)).toBe('just now');
  });

  it('should return minutes ago', () => {
    const date = new Date('2026-09-01T11:55:00Z'); // 5 minutes ago
    expect(timeAgo(date)).toBe('5m ago');
  });

  it('should return 1m for just over 60 seconds', () => {
    const date = new Date('2026-09-01T11:58:59Z'); // 61 seconds ago
    expect(timeAgo(date)).toBe('1m ago');
  });

  it('should return hours ago', () => {
    const date = new Date('2026-09-01T09:00:00Z'); // 3 hours ago
    expect(timeAgo(date)).toBe('3h ago');
  });

  it('should return 1h for just over 60 minutes', () => {
    const date = new Date('2026-09-01T10:59:00Z');
    expect(timeAgo(date)).toBe('1h ago');
  });

  it('should return days ago', () => {
    const date = new Date('2026-08-28T12:00:00Z'); // 4 days ago
    expect(timeAgo(date)).toBe('4d ago');
  });

  it('should return 1d for just over 24 hours', () => {
    const date = new Date('2026-08-31T11:00:00Z');
    expect(timeAgo(date)).toBe('1d ago');
  });

  it('should return weeks ago', () => {
    const date = new Date('2026-08-18T12:00:00Z'); // 2 weeks ago
    expect(timeAgo(date)).toBe('2w ago');
  });

  it('should return 1w for just over 7 days', () => {
    const date = new Date('2026-08-24T12:00:00Z');
    expect(timeAgo(date)).toBe('1w ago');
  });

  it('should return months ago', () => {
    const date = new Date('2026-06-03T12:00:00Z'); // ~3 months ago
    expect(timeAgo(date)).toBe('3mo ago');
  });

  it('should switch to months after 5 weeks', () => {
    const date = new Date('2026-07-26T12:00:00Z'); // 36 days
    expect(timeAgo(date)).toBe('1mo ago');
  });

  it('should accept ISO string', () => {
    const isoString = '2026-09-01T11:58:00Z'; // 2 minutes ago
    expect(timeAgo(isoString)).toBe('2m ago');
  });

  it('should handle future dates gracefully', () => {
    const future = new Date('2026-09-01T12:01:00Z');
    const result = timeAgo(future);
    // Future date will produce negative seconds, should return "just now"
    expect(result).toBe('just now');
  });
});
