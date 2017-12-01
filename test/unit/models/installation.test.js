const { Installation } = require('.');

describe('models.Installation', () => {
  describe('getForOwner', () => {
    test('returns model for owner', async () => {
      const expected = await Installation.create({ githubId: 1, ownerId: 2 });
      const actual = await Installation.getForOwner(2);
      expect(actual).toBeTruthy();
      expect(actual.id).toEqual(expected.id);
    });

    test('returns null for unknown', async () => {
      expect(await Installation.getForOwner(999)).toBe(null);
    });
  });
});
