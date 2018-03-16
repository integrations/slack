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
    test('reads and writes from encryptedAccessToken', () => {
      // clear the unencrypted token
      user.setDataValue('accessToken', undefined);

      expect(user.accessToken).toEqual('test');
    });

    test('reads unencrypted accessToken field if encrypted field not set yet', () => {
      // clear the encrypted token
      user.setDataValue('encryptedAccessToken', undefined);

      expect(user.accessToken).toEqual('test');
    });

    test('updates encryptedAccessToken when setting new value', async () => {
      await user.update({ accessToken: 'updated' });
      await user.reload();
      expect(user.encryptedAccessToken).toEqual('updated');
      expect(user.unencryptedAccessToken).toEqual('updated');
    });

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
