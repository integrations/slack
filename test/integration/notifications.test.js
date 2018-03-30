const nock = require('nock');
const moment = require('moment');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const issuePayload = require('../fixtures/webhooks/issues.opened');
const pullRequestPayload = require('../fixtures/webhooks/pull_request.opened');
const statusPayload = require('../fixtures/webhooks/status');
const publicEventPayload = require('../fixtures/webhooks/public');
const branchDeleted = require('../fixtures/webhooks/branch_deleted.json');
const deploymentStatusSuccessPayload = require('../fixtures/webhooks/deployment/status_success');
const deploymentStatusPendingPayload = require('../fixtures/webhooks/deployment/status_pending');
const pushPayload = require('../fixtures/webhooks/push');
const pushNonDefaultBranchPayload = require('../fixtures/webhooks/push_non_default_branch');
const reviewApproved = require('../fixtures/webhooks/pull_request_review/approved.json');
const reviewCommented = require('../fixtures/webhooks/pull_request_review/commented.json');
const reviewCommentCreated = require('../fixtures/webhooks/pull_request_review/pull_request_review_comment.json');
const repositoryDeleted = require('../fixtures/webhooks/repository.deleted.json');

const {
  Subscription,
  SlackWorkspace,
  Installation,
  SlackUser,
  GitHubUser,
} = models;

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

    test('issues.edited updates issue message', async () => {
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
      }).get('/repos/github-slack/public-test/issues/1').times(2).reply(200, fixtures.issue);

      nock('https://slack.com').post('/api/chat.postMessage').reply(200, { ok: true });

      nock('https://slack.com').post('/api/chat.update', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'issues',
        payload: issuePayload,
      });

      await probot.receive({
        event: 'issues',
        payload: {
          ...issuePayload,
          action: 'edited',
          issue: {
            ...issuePayload.issue,
            body: 'This is some edited content',
          },
        },
      });
    });

    test('issues closed does not make an API call to issues endpoint', async () => {
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

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'issues',
        payload: {
          ...issuePayload,
          action: 'closed',
        },
      });
    });

    test('issues reopened does not make an API call to issues endpoint', async () => {
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

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'issues',
        payload: {
          ...issuePayload,
          action: 'reopened',
        },
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

    test('pull request closed does not make an API call to issues endpoint', async () => {
      await Subscription.subscribe({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(200);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'pull_request',
        payload: {
          ...pullRequestPayload,
          action: 'closed',
        },
      });
    });

    test('pull request reopened does not make an API call to issues endpoint', async () => {
      await Subscription.subscribe({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(200);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'pull_request',
        payload: {
          ...pullRequestPayload,
          action: 'reopened',
        },
      });
    });

    test('pull request opened followed by status', async () => {
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
      }).get('/repos/github-slack/app/issues/31').times(2).reply(200, fixtures.issue);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'pull_request',
        payload: pullRequestPayload,
      });

      nock('https://api.github.com').get('/repos/github-slack/app/pulls/31').reply(200, fixtures.pull);

      nock('https://api.github.com')
        .get(`/repos/integrations/slack/commits/${statusPayload.sha}/status`)
        .reply(200, fixtures.combinedStatus);

      nock('https://slack.com').post('/api/chat.update', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'status',
        payload: statusPayload,
      });
    });

    test('status event with no matching PR does not update a message', async () => {
      await Subscription.subscribe({
        githubId: statusPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

      await probot.receive({
        event: 'status',
        payload: statusPayload,
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

    test('ref event does not get delivered if not explicitly enabled', async () => {
      await Subscription.subscribe({
        githubId: branchDeleted.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

      await probot.receive({
        event: 'delete',
        payload: branchDeleted,
      });
    });

    test('review event', async () => {
      await Subscription.subscribe({
        githubId: reviewApproved.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        settings: { reviews: true },
      });

      nock('https://api.github.com').get(`/repositories/${reviewApproved.repository.id}`).reply(200);
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'pull_request_review',
        payload: reviewApproved,
      });
    });

    test('review event updated', async () => {
      await Subscription.subscribe({
        githubId: reviewApproved.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        settings: { reviews: true },
      });

      nock('https://api.github.com').get(`/repositories/${reviewApproved.repository.id}`).reply(200);
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      nock('https://slack.com').post('/api/chat.update', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'pull_request_review',
        payload: reviewApproved,
      });

      await probot.receive({
        event: 'pull_request_review',
        payload: {
          ...reviewApproved,
          review: {
            ...reviewApproved.review,
            body: 'This really is a great pull request',
          },
        },
      });
    });

    test('review event does not get delivered if not explicitly enabled', async () => {
      await Subscription.subscribe({
        githubId: reviewApproved.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

      await probot.receive({
        event: 'pull_request_review',
        payload: reviewApproved,
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

      nock('https://api.github.com').get(`/repositories/${deploymentStatusPendingPayload.repository.id}`).reply(200);
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

      await probot.receive({
        event: 'issue_comment',
        payload: commentPayload,
      });
    });

    test('comments are updated when edited', async () => {
      const commentPayload = fixtures.github.webhooks.issue_comment;

      await Subscription.subscribe({
        githubId: commentPayload.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        settings: ['comments'], // Turn on comments
      });

      nock('https://slack.com').post('/api/chat.postMessage').reply(200, { ok: true });

      nock('https://api.github.com')
        .get(`/repositories/${commentPayload.repository.id}`)
        .times(2) // once for issue comment count, once for comment notification
        .reply(200, commentPayload.repository);

      await probot.receive({
        event: 'issue_comment',
        payload: commentPayload,
      });

      nock('https://slack.com').post('/api/chat.update', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'issue_comment',
        payload: {
          ...commentPayload,
          action: 'edited',
          comment: {
            ...commentPayload.comment,
            body: 'an edit',
          },
        },
      });
    });

    test('does not deliver pushes on non-default branch if not explicitly enabled', async () => {
      nock('https://api.github.com').get(`/repositories/${pushNonDefaultBranchPayload.repository.id}`).reply(200);

      await Subscription.subscribe({
        githubId: pushNonDefaultBranchPayload.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

      // Should not trigger any deliveries
      await probot.receive({
        event: 'push',
        payload: pushNonDefaultBranchPayload,
      });
    });

    test('delivers pushes on non default branch if enabled', async () => {
      nock('https://api.github.com').get(`/repositories/${pushNonDefaultBranchPayload.repository.id}`).reply(200);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await Subscription.subscribe({
        githubId: pushNonDefaultBranchPayload.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        settings: { commits: 'all' },
      });

      await probot.receive({
        event: 'push',
        payload: pushNonDefaultBranchPayload,
      });
    });

    test('does not deliver push with no commits', async () => {
      const payload = { ...pushPayload, commits: [] };

      nock('https://api.github.com').get(`/repositories/${payload.repository.id}`).reply(200);

      await Subscription.subscribe({
        githubId: payload.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        settings: { commits: 'all' },
      });

      await probot.receive({ event: 'push', payload });
    });

    test('does not deliver empty reviews which are actually review comments', async () => {
      const payload = reviewCommented;
      payload.review.body = null;

      nock('https://api.github.com').get(`/repositories/${payload.repository.id}`).reply(200);

      await Subscription.subscribe({
        githubId: payload.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        settings: { reviews: true },
      });

      await probot.receive({ event: 'pull_request_review', payload });
    });

    test('delivers pull request review commments if comments are enabled', async () => {
      await Subscription.subscribe({
        githubId: reviewCommentCreated.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        settings: { comments: true },
      });

      nock('https://api.github.com').get(`/repositories/${reviewCommentCreated.repository.id}`).reply(200);
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'pull_request_review_comment',
        payload: reviewCommentCreated,
      });
    });

    test('does not deliver pull request review comments if not explicitly enabled', async () => {
      await Subscription.subscribe({
        githubId: reviewCommentCreated.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

      // Should not trigger any deliveries
      await probot.receive({
        event: 'issue_comment',
        payload: reviewCommentCreated,
      });
    });

    test('repository.deleted posts to channel and deletes subcription', async () => {
      repositoryDeleted.repository.updated_at = moment().subtract(2, 'months');
      await Subscription.subscribe({
        githubId: repositoryDeleted.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

      expect((await Subscription.lookup(repositoryDeleted.repository.id)).length).toBe(1);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        event: 'repository',
        payload: repositoryDeleted,
      });

      expect((await Subscription.lookup(repositoryDeleted.repository.id)).length).toBe(0);
    });
  });
});
