/**
 * Simple Unit Tests
 *
 * Basic tests to verify testing infrastructure works
 */

import { describe, test, expect } from 'vitest';

describe('Testing Infrastructure', () => {
  test('basic math works', () => {
    expect(1 + 1).toBe(2);
  });

  test('string operations work', () => {
    const domain = 'admin';
    const capitalized = domain.charAt(0).toUpperCase() + domain.slice(1);
    expect(capitalized).toBe('Admin');
  });

  test('array operations work', () => {
    const domains = ['admin', 'finance', 'clients'];
    const filtered = domains.filter(d => d !== 'admin');
    expect(filtered).toEqual(['finance', 'clients']);
  });
});

describe('TTL Constants', () => {
  test('5 minutes should be 300000 milliseconds', () => {
    const FIVE_MIN = 5 * 60 * 1000;
    expect(FIVE_MIN).toBe(300000);
  });

  test('TTL freshness check logic', () => {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const tenMinutesAgo = now - (10 * 60 * 1000);

    // Data from 5 min ago is fresh (exactly at threshold)
    expect(now - fiveMinutesAgo).toBe(300000);

    // Data from 10 min ago is stale
    expect(now - tenMinutesAgo).toBeGreaterThan(300000);
  });
});

describe('Rank System', () => {
  test('rank hierarchy is correct', () => {
    const ranks = ['admiral', 'commodore', 'captain', 'crew'];

    // Admiral is highest (index 0)
    expect(ranks.indexOf('admiral')).toBe(0);

    // Crew is lowest (index 3)
    expect(ranks.indexOf('crew')).toBe(3);

    // Commodore outranks Captain
    expect(ranks.indexOf('commodore')).toBeLessThan(ranks.indexOf('captain'));
  });
});
