const { SlackWorkspace } = require('.');

describe('SlackWorkspace', () => {
  let workspace;
  beforeEach(async () => {
    workspace = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxp-token',
      botAccessToken: 'xoxb-token',
    });
  });

  describe('acccessToken', () => {
    test('is excluded from toJSON()', () => {
      expect(workspace.toJSON()).not.toHaveProperty('accessToken');
      expect(workspace.toJSON()).not.toHaveProperty('secrets');

      // ensure original values weren't deleted
      expect(workspace.accessToken).toEqual('xoxp-token');
    });
  });

  describe('botAcccessToken', () => {
    test('is excluded from toJSON()', () => {
      expect(workspace.toJSON()).not.toHaveProperty('botAccessToken');
      expect(workspace.toJSON()).not.toHaveProperty('secrets');

      // ensure original values weren't deleted
      expect(workspace.botAccessToken).toEqual('xoxb-token');
    });
  });
});
