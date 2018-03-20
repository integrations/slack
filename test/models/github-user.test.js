const nock = require('nock');

const { GitHubUser } = require('.');

describe('GitHubUser', () => {
  let user;
  beforeEach(async () => {
    user = await GitHubUser.create({
      id: 173,
      accessToken: 'test',
    });
  });

  describe('acccessToken', () => {
    test('is excluded from toJSON()', () => {
      expect(user.toJSON()).not.toHaveProperty('accessToken');
      expect(user.toJSON()).not.toHaveProperty('secrets');

      // ensure original values weren't deleted
      expect(user.accessToken).toEqual('test');
    });
  });

  describe('hasRepoAccess', () => {
    test('returns true for user with access', async () => {
      nock('https://api.github.com').get('/repositories/1').reply(200);
      await expect(user.hasRepoAccess(1)).resolves.toBe(true);
    });
    test('returns true for unexpected status codes', async () => {
      nock('https://api.github.com').get('/repositories/1').reply(500);
      await expect(user.hasRepoAccess(1)).resolves.toBe(true);
    });
    test('returns false for user without access', async () => {
      nock('https://api.github.com').get('/repositories/1').reply(404);
      await expect(user.hasRepoAccess(1)).resolves.toBe(false);
    });
  });
});
