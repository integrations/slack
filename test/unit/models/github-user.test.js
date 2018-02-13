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

  describe('hasRepoAccess', () => {
    test('returns true for user with access', async () => {
      nock('https://api.github.com').get('/repositories/1').reply(200);
      await expect(user.hasRepoAccess(1)).resolves.toBe(true);
    });
    test('throws error for unexpected status codes', async () => {
      nock('https://api.github.com').get('/repositories/1').reply(500);
      await expect(user.hasRepoAccess(1)).rejects.toThrow();
    });
    test('returns false for user without access', async () => {
      nock('https://api.github.com').get('/repositories/1').reply(404);
      await expect(user.hasRepoAccess(1)).resolves.toBe(false);
    });
  });
});
