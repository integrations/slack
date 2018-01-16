const storage = require('../../lib/storage');

describe('storage', () => {
  beforeEach(() => storage.clear());

  test('sets and gets value', async () => {
    await storage.set('foo', 'bar');
    expect(await storage.get('foo')).toEqual('bar');
  });

  test('returns null for unset keys', async () => {
    expect(await storage.get('nope')).toBe(undefined);
  });
});
