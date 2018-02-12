const request = require('supertest');
const nock = require('nock');

const helper = require('.');
const configMigrationEvent = require('../fixtures/slack/config_migration.json');
const configMigrationEventSingleConfiguration = require('../fixtures/slack/config_migration_single.json');

const { probot } = helper;

describe('Integration: Slack config_migration event', () => {
  beforeEach(async () => {
    const { SlackWorkspace } = helper.robot.models;
    await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxa-token',
    });
  });
  describe('LegacySubscription rows are created in the db and prompt is posted in Slack', () => {
    test('works for 33 legacy configurations', async () => {
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).times(5).reply(200, { ok: true });
      const { LegacySubscription } = helper.robot.models;
      await request(probot.server)
        .post('/slack/events')
        .send(configMigrationEvent)
        .expect(200);

      const legacySubscriptions = await LegacySubscription.count();
      expect(legacySubscriptions).toBe(33);
    });
    test('Works for 1 legacy configuration', async () => {
      const { LegacySubscription } = helper.robot.models;
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await request(probot.server)
        .post('/slack/events')
        .send(configMigrationEventSingleConfiguration)
        .expect(200);

      const legacySubscriptions = await LegacySubscription.count();
      expect(legacySubscriptions).toBe(1);
    });
  });
});
