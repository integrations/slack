const nock = require('nock');

const helper = require('.');
const fixtures = require('../fixtures');

const { probot } = helper;

const issuePayload = require('../fixtures/webhooks/issues.opened');
const pullRequestPayload = require('../fixtures/webhooks/pull_request.opened');
const publicEventPayload = require('../fixtures/webhooks/public');
const branchDeleted = require('../fixtures/webhooks/branch_deleted.json');
const deploymentStatusSuccessPayload = require('../fixtures/webhooks/deployment/status_success');
const deploymentStatusPendingPayload = require('../fixtures/webhooks/deployment/status_pending');

const {
  Subscription,
  SlackWorkspace,
  Installation,
  SlackUser,
  GitHubUser,
} = helper.robot.models;

describe('Integration: notifications', () => {
  describe('to a subscribed channel', () => {
    let workspace;
    let installation;
    let githubUser;
    let slackUser;

    beforeEach(async () => {
      workspace = await SlackWorkspace.create({
        slackId: 'T001',
        accessToken: 'test',
      });

      installation = await Installation.create({
        githubId: 1,
        ownerId: 1,
      });

      githubUser = await GitHubUser.create({
        id: 1,
        accessToken: 'secret',
      });

      slackUser = await SlackUser.create({
        slackId: 'U012345',
        slackWorkspaceId: workspace.id,
        githubId: githubUser.id,
      });
    });

    test('issue opened', async () => {
      await Subscription.subscribe({
        githubId: issuePayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

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
      await Subscription.subscribe({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

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
      await Subscription.subscribe({
        githubId: publicEventPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

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

    test('ref event', async () => {
      await Subscription.subscribe({
        githubId: branchDeleted.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        settings: { branches: true },
      });

      nock('https://api.github.com').get(`/repositories/${branchDeleted.repository.id}`).reply(200);
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'delete',
        payload: branchDeleted,
      });
    });

    test('deployment_status event', async () => {
      await Subscription.subscribe({
        githubId: deploymentStatusPendingPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

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
      await Subscription.subscribe({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

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
      const subscription = await Subscription.subscribe({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
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

    test('does not deliver comments if not explicitly enabled', async () => {
      const commentPayload = fixtures.github.webhooks.issue_comment;

      await Subscription.subscribe({
        githubId: commentPayload.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

      // Should not trigger any deliveries
      await probot.receive({
        event: 'issue_comment',
        payload: commentPayload,
      });
    });

    test('with comments enabled', async () => {
      const commentPayload = fixtures.github.webhooks.issue_comment;

      await Subscription.subscribe({
        githubId: commentPayload.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        settings: ['comments'], // Turn on comments
      });

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      nock('https://api.github.com')
        .get(`/repositories/${commentPayload.repository.id}`)
        .times(2) // once for issue comment count, once for comment notification
        .reply(200, commentPayload.repository);

      // Should not trigger any deliveries
      await probot.receive({
        event: 'issue_comment',
        payload: commentPayload,
      });
    });
  });
});
