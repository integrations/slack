const request = require('supertest');
const nock = require('nock');

const helper = require('.');
const fixtures = require('../fixtures');

const { probot } = helper;

const issuePayload = require('../fixtures/webhooks/issues.opened');
const pullRequestPayload = require('../fixtures/webhooks/pull_request.opened');

describe('Integration: notifications', () => {
  describe('to a subscribed channel', () => {
    beforeEach(async () => {
      const { Subscription } = helper.robot.models;

      await Subscription.create({
        githubId: issuePayload.repository.id,
        channelId: 'C001',
      });

      await Subscription.create({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
      });
    });

    test('issue opened', async () => {
      nock('https://api.github.com', { reqHeaders: {
        Accept: 'application/vnd.github.html+json',
      } }).get('/repos/github-slack/public-test/issues/1').reply(200, fixtures.issue);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'issues',
        payload: issuePayload,
      });
    });

    test('pull request opened', async () => {
      nock('https://api.github.com', { reqHeaders: {
        Accept: 'application/vnd.github.html+json',
      } }).get('/repos/github-slack/app/issues/31').reply(200, fixtures.issue);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'pull_request',
        payload: pullRequestPayload,
      });
    });
  });
});
