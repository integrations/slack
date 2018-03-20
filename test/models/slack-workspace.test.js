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
    test('is excluded from toJSON()', () => {
      expect(workspace.toJSON()).not.toHaveProperty('accessToken');
      expect(workspace.toJSON()).not.toHaveProperty('secrets');

      // ensure original values weren't deleted
      expect(workspace.accessToken).toEqual('test');
    });
  });
});
