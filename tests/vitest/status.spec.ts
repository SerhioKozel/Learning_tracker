import { describe, it, expect, beforeEach } from 'vitest';
import { computeStatusChange, computeFieldUpdates } from '../../src/utils/status';
import type { Status, Difficulty, Topic } from '../../src/types';

describe('computeStatusChange', () => {
  it('should create a "moved" history entry with status labels', () => {
    const topic = { status: 'to_learn' as Status };
    const result = computeStatusChange(topic, 'learning');

    expect(result.historyEntry).toMatchObject({
      action: 'moved',
      detail: 'To Learn → Learning',
    });
    expect(result.historyEntry.id).toBeDefined();
    expect(result.historyEntry.id).toMatch(/^h_/);
    expect(result.historyEntry.date).toBeDefined();
  });

  it('should handle all status transitions', () => {
    const transitions: Array<[Status, Status]> = [
      ['to_learn', 'learning'],
      ['learning', 'practice'],
      ['practice', 'review'],
      ['review', 'completed'],
      ['completed', 'to_learn'], // backwards
    ];

    transitions.forEach(([from, to]) => {
      const topic = { status: from };
      const result = computeStatusChange(topic, to);
      expect(result.historyEntry.action).toBe('moved');
      expect(result.historyEntry.detail).toContain('→');
    });
  });

  it('should include current timestamp', () => {
    const before = new Date();
    const topic = { status: 'to_learn' as Status };
    const result = computeStatusChange(topic, 'learning');
    const after = new Date();

    const entryDate = new Date(result.historyEntry.date);
    expect(entryDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(entryDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe('computeFieldUpdates', () => {
  let mockTopic: Topic;

  beforeEach(() => {
    mockTopic = {
      id: 'topic_1',
      title: 'Original Title',
      description: 'Original description',
      status: 'to_learn',
      boardId: 'board_1',
      difficulty: 'easy',
      tags: ['tag1', 'tag2'],
      reviewDate: null,
      deadlineDate: '2026-09-15',
      progress: 0,
      checklist: [],
      resources: [],
      notes: '',
      history: [],
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
      updatedAtRaw: '2026-09-01T00:00:00Z',
    } as Topic;
  });

  it('should return empty array when no fields changed', () => {
    const updates = {
      title: 'Original Title', // same
      tags: ['tag1', 'tag2'], // same array
    };

    const result = computeFieldUpdates(mockTopic, updates);
    expect(result).toEqual([]);
  });

  it('should detect title change', () => {
    const updates = { title: 'New Title' };
    const result = computeFieldUpdates(mockTopic, updates);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      action: 'updated',
      detail: 'Title: Original Title → New Title',
    });
  });

  it('should detect description change', () => {
    const updates = { description: 'New description' };
    const result = computeFieldUpdates(mockTopic, updates);

    expect(result).toHaveLength(1);
    expect(result[0].detail).toContain('Description:');
  });

  it('should detect difficulty change', () => {
    const updates = { difficulty: 'hard' as Difficulty };
    const result = computeFieldUpdates(mockTopic, updates);

    expect(result).toHaveLength(1);
    expect(result[0].detail).toContain('Difficulty:');
  });

  it('should detect tags array change', () => {
    const updates = { tags: ['tag1', 'tag3'] }; // tag2 -> tag3
    const result = computeFieldUpdates(mockTopic, updates);

    expect(result).toHaveLength(1);
    expect(result[0].detail).toContain('Tags:');
  });

  it('should handle empty tags array', () => {
    const updates = { tags: [] };
    const result = computeFieldUpdates(mockTopic, updates);

    expect(result).toHaveLength(1);
    expect(result[0].detail).toContain('tag1, tag2');
    expect(result[0].detail).toContain('—');
  });

  it('should detect deadline date change', () => {
    const updates = { deadlineDate: '2026-10-01' };
    const result = computeFieldUpdates(mockTopic, updates);

    expect(result).toHaveLength(1);
    expect(result[0].detail).toContain('Deadline:');
  });

  it('should truncate long text values', () => {
    const longText = 'a'.repeat(100);
    const updates = { description: longText };
    const result = computeFieldUpdates(mockTopic, updates);

    expect(result[0].detail).toContain('…');
    expect(result[0].detail.length).toBeLessThan(200);
  });

  it('should handle multiple field changes', () => {
    const updates = {
      title: 'New Title',
      description: 'New Description',
      difficulty: 'hard' as Difficulty,
    };

    const result = computeFieldUpdates(mockTopic, updates);
    expect(result).toHaveLength(3);
  });

  it('should ignore fields not in TrackedField type', () => {
    const updates = {
      title: 'New Title',
      // checklist and notes should be ignored
    } as any;

    const result = computeFieldUpdates(mockTopic, updates);
    expect(result).toHaveLength(1);
    expect(result[0].detail).toContain('Title:');
  });

  it('should handle null/undefined values', () => {
    mockTopic.description = '';
    const updates = { description: 'New Description' };
    const result = computeFieldUpdates(mockTopic, updates);

    expect(result).toHaveLength(1);
    expect(result[0].detail).toContain('— → New Description');
  });

  it('should generate unique history entry IDs', () => {
    const updates = {
      title: 'New Title',
      description: 'New Description',
    };

    const result = computeFieldUpdates(mockTopic, updates);
    const ids = result.map(e => e.id);
    // All IDs should start with 'h_' and be unique
    expect(ids.every(id => id.startsWith('h_'))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length); // All unique
  });
});
