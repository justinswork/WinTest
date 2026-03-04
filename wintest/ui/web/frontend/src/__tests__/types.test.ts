import { describe, it, expect } from 'vitest';
import { newStep } from '../api/types';

describe('newStep', () => {
  it('returns action as click', () => {
    expect(newStep().action).toBe('click');
  });

  it('returns expected as true', () => {
    expect(newStep().expected).toBe(true);
  });

  it('returns correct retry defaults', () => {
    const s = newStep();
    expect(s.retry_attempts).toBe(3);
    expect(s.retry_delay).toBe(2.0);
  });

  it('returns zero for numeric defaults', () => {
    const s = newStep();
    expect(s.scroll_amount).toBe(0);
    expect(s.wait_seconds).toBe(0);
  });

  it('returns null for all optional fields', () => {
    const s = newStep();
    expect(s.target).toBeNull();
    expect(s.text).toBeNull();
    expect(s.key).toBeNull();
    expect(s.keys).toBeNull();
    expect(s.timeout).toBeNull();
    expect(s.app_path).toBeNull();
    expect(s.app_title).toBeNull();
  });

  it('returns empty string for description', () => {
    expect(newStep().description).toBe('');
  });

  it('returns independent objects on each call', () => {
    const a = newStep();
    const b = newStep();
    a.action = 'type';
    expect(b.action).toBe('click');
  });
});
