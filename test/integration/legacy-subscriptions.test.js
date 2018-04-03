const request = require('supertest');
const nock = require('nock');

const { probot, models } = require('.');
const configMigrationEvent = require('../fixtures/slack/config_migration.json');
const configMigrationEventSingleConfiguration = require('../fixtures/slack/config_migration_single.json');

describe('Integration: Slack config_migration event', () => {
  beforeEach(async () => {
    const { SlackWorkspace } = models;
    await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxa-token',
    });
  });
  describe('LegacySubscription rows are created in the db and prompt is posted in Slack', () => {
    test('works for 34 legacy configurations', async () => {
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).times(4).reply(200, { ok: true });
      const { LegacySubscription } = models;
      await request(probot.server)
        .post('/slack/events')
        .send(configMigrationEvent)
        .expect(200);

      expect(await LegacySubscription.count()).toBe(34);
    });
    test('Works for 1 legacy configuration', async () => {
      const { LegacySubscription } = models;
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await request(probot.server)
        .post('/slack/events')
        .send(configMigrationEventSingleConfiguration)
        .expect(200);

      expect(await LegacySubscription.count()).toBe(1);
    });
    test('does not duplicate legacy configurations', async () => {
      const { LegacySubscription } = models;
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).times(1).reply(200, { ok: true });

      await request(probot.server)
        .post('/slack/events')
        .send(configMigrationEventSingleConfiguration)
        .expect(200);

      expect(await LegacySubscription.count()).toBe(1);

      await request(probot.server)
        .post('/slack/events')
        .send(configMigrationEventSingleConfiguration)
        .expect(200);

      expect(await LegacySubscription.count()).toBe(1);
    });
  });
});
