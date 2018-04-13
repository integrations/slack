const hasEarlyAccess = require('../../lib/slack/has-early-access');

describe('has early access', () => {
  test('returns false when neither EARLY_ACCESS_CHANNELS nor EARLY_ACCESS_WORKSPACES is set', () => {
    expect(hasEarlyAccess({ channelId: 'C054321' })).toBe(false);
  });
  test('works for one channel', () => {
    process.env.EARLY_ACCESS_CHANNELS = 'C01234';
    expect(hasEarlyAccess({ channelId: 'C01234' })).toBe(true);
  });

  test('works for multiple channels', () => {
    process.env.EARLY_ACCESS_CHANNELS = 'C01234,C054321';
    expect(hasEarlyAccess({ channelId: 'C01234' })).toBe(true);
    expect(hasEarlyAccess({ channelId: 'C054321' })).toBe(true);
  });

  test('works for one workspace', () => {
    process.env.EARLY_ACCESS_WORKSPACES = 'T01234';
    expect(hasEarlyAccess({ teamId: 'T01234' })).toBe(true);
  });

  test('works for multiple workspaces', () => {
    process.env.EARLY_ACCESS_WORKSPACES = 'T01234,T054321';
    expect(hasEarlyAccess({ teamId: 'T01234' })).toBe(true);
    expect(hasEarlyAccess({ teamId: 'T054321' })).toBe(true);
  });

  test('returns true when workspace has early access but channel does not', () => {
    process.env.EARLY_ACCESS_WORKSPACES = 'T01234';
    process.env.EARLY_ACCESS_CHANNELS = 'C01234';
    expect(hasEarlyAccess({ channelId: 'C01111', teamId: 'T01234' })).toBe(true);
  });

  test('returns true when channel has early access but workspace does not', () => {
    process.env.EARLY_ACCESS_WORKSPACES = 'T01234';
    process.env.EARLY_ACCESS_CHANNELS = 'C01234';
    expect(hasEarlyAccess({ teamId: 'T099999', channelId: 'C01234' })).toBe(true);
  });
});
