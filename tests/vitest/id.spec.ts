import { describe, it, expect } from 'vitest';
import { generateId } from '../../src/utils/id';

describe('generateId', () => {
  it('should generate a string with the prefix', () => {
    const id = generateId('t');
    expect(id).toMatch(/^t_/);
  });

  it('should generate unique IDs', () => {
    const id1 = generateId('b');
    const id2 = generateId('b');
    expect(id1).not.toBe(id2);
  });

  it('should contain a valid UUID after prefix', () => {
    const id = generateId('c');
    const parts = id.split('_');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toBe('c');
    // UUID format: 8-4-4-4-12 hex digits
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(parts[1]).toMatch(uuidPattern);
  });

  it('should work with different prefixes', () => {
    const prefixes = ['b', 't', 'c', 'r', 'h'];
    prefixes.forEach(prefix => {
      const id = generateId(prefix);
      expect(id.startsWith(`${prefix}_`)).toBe(true);
    });
  });

  it('should generate collision-resistant IDs across many calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId('t'));
    }
    // All 1000 IDs should be unique
    expect(ids.size).toBe(1000);
  });
});
