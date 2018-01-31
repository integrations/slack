const nock = require('nock');

const helper = require('.');
const fixtures = require('../fixtures');

const { probot } = helper;

const issuePayload = require('../fixtures/webhooks/issues.opened');
const pullRequestPayload = require('../fixtures/webhooks/pull_request.opened');
const publicEventPayload = require('../fixtures/webhooks/public');
const deploymentStatusSuccessPayload = require('../fixtures/webhooks/deployment/status_success');
const deploymentStatusPendingPayload = require('../fixtures/webhooks/deployment/status_pending');

describe('Integration: notifications', () => {
  describe('to a subscribed channel', () => {
    beforeEach(async () => {
      const {
        Subscription,
        SlackWorkspace,
        Installation,
        SlackUser,
        GitHubUser,
      } = helper.robot.models;

      const workspace = await SlackWorkspace.create({
        slackId: 'T001',
        accessToken: 'test',
      });

      const installation = await Installation.create({
        githubId: 1,
        ownerId: 1,
      });

      const githubUser = await GitHubUser.create({
        id: 1,
        accessToken: 'secret',
      });

      const slackUser = await SlackUser.create({
        slackId: 'U012345',
        slackWorkspaceId: workspace.id,
        githubId: githubUser.id,
      });

      await Subscription.subscribe({
        githubId: issuePayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

      await Subscription.subscribe({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

      await Subscription.subscribe({
        githubId: publicEventPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });
    });

    test('issue opened', async () => {
      nock('https://api.github.com').get(`/repositories/${issuePayload.repository.id}`).reply(200, {
        full_name: issuePayload.repository.full_name,
      });
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/public-test/issues/1').reply(200, fixtures.issue);

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
      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(200);
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/app/issues/31').reply(200, fixtures.issue);

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
      nock('https://api.github.com').get(`/repositories/${publicEventPayload.repository.id}`).reply(200);
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'public',
        payload: publicEventPayload,
      });
    });

    test('deployment_status event', async () => {
      nock('https://api.github.com').get(`/repositories/${deploymentStatusPendingPayload.repository.id}`).times(2).reply(200);
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      nock('https://slack.com').post('/api/chat.update', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'deployment_status',
        payload: deploymentStatusPendingPayload,
      });

      await probot.receive({
        event: 'deployment_status',
        payload: deploymentStatusSuccessPayload,
      });
    });
    test('post prompt to re-subscribe after user loses access to repo', async () => {
      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(404);
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'pull_request',
        payload: pullRequestPayload,
      });
    });
    test('message still gets delivered if no creatorId is set on Subscription', async () => {
      const { Subscription } = helper.robot.models;
      const subscription = await Subscription.findOne({
        where: { githubId: pullRequestPayload.repository.id },
      });
      subscription.creatorId = null;
      await subscription.save();
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/app/issues/31').reply(200, fixtures.issue);

      await probot.receive({
        event: 'pull_request',
        payload: pullRequestPayload,
      });
    });
  });
});
