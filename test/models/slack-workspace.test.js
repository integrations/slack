const { SlackWorkspace } = require('.');

describe('SlackWorkspace', () => {
  let workspace;
  beforeEach(async () => {
    workspace = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'test',
    });
  });

  describe('acccessToken', () => {
    test('reads and writes from encryptedAccessToken', () => {
      // clear the unencrypted token
      workspace.setDataValue('accessToken', undefined);

      expect(workspace.accessToken).toEqual('test');
    });

    test('reads unencrypted accessToken field if encrypted field not set yet', () => {
      // clear the encrypted token
      workspace.setDataValue('encryptedAccessToken', undefined);

      expect(workspace.accessToken).toEqual('test');
    });

    test('is excluded from toJSON()', () => {
      expect(workspace.toJSON()).not.toHaveProperty('accessToken');
      expect(workspace.toJSON()).not.toHaveProperty('secrets');

      // ensure original values weren't deleted
      expect(workspace.accessToken).toEqual('test');
    });
  });
});
