const nock = require('nock');

const helper = require('.');
const fixtures = require('../fixtures');

const { probot } = helper;

const issuePayload = require('../fixtures/webhooks/issues.opened');
const pullRequestPayload = require('../fixtures/webhooks/pull_request.opened');
const publicEventPayload = require('../fixtures/webhooks/public');

describe('Integration: notifications', () => {
  describe('to a subscribed channel', () => {
    beforeEach(async () => {
      const { Subscription, SlackWorkspace } = helper.robot.models;

      const workspace = await SlackWorkspace.create({
        slackId: 'T001',
        accessToken: 'test',
      });

      await Subscription.create({
        githubId: issuePayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
      });

      await Subscription.create({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
      });

      await Subscription.create({
        githubId: publicEventPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
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

    test('public event', async () => {
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'public',
        payload: publicEventPayload,
      });
    });
  });
});
