const { LegacySubscription, logger } = require('.');
const nock = require('nock');
const client = require('../../../lib/slack/client').createClient();

describe('LegacySubscription', () => {
  describe('activate', () => {
    let record;

    beforeEach(async () => {
      logger.level('fatal');

      record = await LegacySubscription.create({
        serviceSlackId: 1,
        workspaceSlackId: 'T001',
        repoGitHubId: 2,
        repoFullName: 'foo/bar',
        authorSlackId: 3,
        channelSlackId: 'C001',
        originalSlackConfiguration: {},
      });
    });

    test('ignores invalid_service error', async () => {
      nock('https://slack.com').post('/api/services.update')
        .reply(200, { ok: false, error: 'service_removed' });

      await expect(record.deactivate(client)).resolves.toBeTruthy();
      expect(record.activatedAt).toBeTruthy();
    });

    test('ignores invalid_service error', async () => {
      nock('https://slack.com').post('/api/services.update')
        .reply(200, { ok: false, error: 'something_else' });

      await expect(record.deactivate(client)).rejects.toThrow('something_else');
      expect(record.activatedAt).toBeNull();
    });
  });
});
