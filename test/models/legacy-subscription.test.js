const { LegacySubscription } = require('.');
const nock = require('nock');
const client = require('../../lib/slack/client').createClient();
const migration = require('../fixtures/slack/config_migration_single');

describe('LegacySubscription', () => {
  describe('importAll', () => {
    test('does not return previously imported subscriptions', async () => {
      let subscriptions = await LegacySubscription.importAll(migration.event.configs);

      expect(subscriptions).toEqual([
        expect.objectContaining({
          channelSlackId: 'C0D70MRAL',
          authorSlackId: 'U06AXEE2U',
          repoFullName: 'berttest/testrepo1',
        }),
      ]);

      subscriptions = await LegacySubscription.importAll(migration.event.configs);
      expect(subscriptions).toEqual([]);
    });
  });

  describe('activate', () => {
    let record;

    beforeEach(async () => {
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

    test('ignores service_removed error', async () => {
      nock('https://slack.com').post('/api/services.update')
        .reply(200, { ok: false, error: 'service_removed' });

      await expect(record.deactivate(client)).resolves.toBeTruthy();
      expect(record.activatedAt).toBeTruthy();
    });

    test('doesn\'t ignore other errors', async () => {
      nock('https://slack.com').post('/api/services.update')
        .reply(200, { ok: false, error: 'something_else' });

      await expect(record.deactivate(client)).rejects.toThrow('something_else');
      expect(record.activatedAt).toBeNull();
    });
  });
});
