import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes with false values', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('handles conditional classes with true values', () => {
    expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
  });

  it('resolves Tailwind class conflicts (later class wins)', () => {
    // tailwind-merge should resolve px conflicts: last one wins
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('handles undefined and null values', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('handles arrays of class names', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });
});
