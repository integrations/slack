const nock = require('nock');
const moment = require('moment');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const issuePayload = require('../fixtures/webhooks/issues.opened');
const pullRequestPayload = require('../fixtures/webhooks/pull_request.opened');
const statusPayload = require('../fixtures/webhooks/status');
const checkPayload = require('../fixtures/webhooks/check');
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
const releasePublishedPayload = require('../fixtures/webhooks/release.published.json');
const gollumEvent = require('../fixtures/webhooks/gollum.json');

const {
  Subscription,
  SlackWorkspace,
  Installation,
  SlackUser,
  GitHubUser,
  DeletedSubscription,
} = models;
const { parseSettings } = require('../../lib/settings-helper');

describe('Integration: notifications', () => {
  describe('to a subscribed channel', () => {
    let workspace;
    let installation;
    let githubUser;
    let slackUser;

    beforeEach(async () => {
      workspace = await SlackWorkspace.create({
        id: 9523, // same id always for jest snapshots
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
        type: 'repo',
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
        name: 'issues',
        payload: issuePayload,
      });

      const subs = await Subscription.lookup(issuePayload.repository.id);
      expect(subs).toHaveLength(1);
      expect(subs[0].githubName).toBe('github-slack/public-test');
    });

    test('issues.edited updates issue message', async () => {
      await Subscription.subscribe({
        githubId: issuePayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
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
        name: 'issues',
        payload: issuePayload,
      });

      await probot.receive({
        name: 'issues',
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
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${issuePayload.repository.id}`).reply(200, {
        full_name: issuePayload.repository.full_name,
      });

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'issues',
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
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${issuePayload.repository.id}`).reply(200, {
        full_name: issuePayload.repository.full_name,
      });

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'issues',
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
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(200);
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/app/pulls/31').reply(200, { ...fixtures.pull, ...fixtures.issue });
      nock('https://api.github.com').get('/repos/github-slack/app/pulls/10191/reviews').reply(200, fixtures.reviews);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'pull_request',
        payload: pullRequestPayload,
      });
    });

    test('pull request ready_for_review', async () => {
      await Subscription.subscribe({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(200);
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/app/pulls/31').reply(200, { ...fixtures.pull, ...fixtures.issue, merged: false });
      nock('https://api.github.com').get('/repos/github-slack/app/pulls/10191/reviews').reply(200, fixtures.reviews);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'pull_request',
        payload: {
          ...pullRequestPayload,
          action: 'ready_for_review',
        },
      });
    });

    test('pull request closed does not make an API call to issues endpoint', async () => {
      await Subscription.subscribe({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(200);
      nock('https://api.github.com').get('/repos/github-slack/app/pulls/31/reviews').reply(200, fixtures.reviews);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'pull_request',
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
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(200);
      nock('https://api.github.com').get('/repos/github-slack/app/pulls/31/reviews').reply(200, fixtures.reviews);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'pull_request',
        payload: {
          ...pullRequestPayload,
          action: 'reopened',
        },
      });
    });

    test('pull request opened followed by statuses and checks', async () => {
      jest.setTimeout(10000);
      await Subscription.subscribe({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(200);
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/app/pulls/31').reply(200, { ...fixtures.pull, ...fixtures.issue, number: 31 });
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/app/issues/31').reply(200, fixtures.issue);
      nock('https://api.github.com').get('/repos/github-slack/app/pulls/31/reviews').reply(200, fixtures.reviews);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'pull_request',
        payload: pullRequestPayload,
      });

      nock('https://api.github.com').get('/repos/github-slack/app/pulls/31').reply(200, fixtures.pull);

      nock('https://api.github.com').get('/repos/github-slack/app/pulls/1535/reviews').reply(200, fixtures.reviews);

      nock('https://api.github.com')
        .get(`/repos/github-slack/app/commits/${statusPayload.sha}/status`)
        .reply(200, fixtures.combinedStatus);

      nock('https://api.github.com')
        .get(`/repos/github-slack/app/commits/${statusPayload.sha}/check-runs`)
        .reply(200, fixtures.checks);

      nock('https://slack.com').post('/api/chat.update', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'status',
        payload: statusPayload,
      });
    });

    test('pull request opened followed by statuses and no checks', async () => {
      jest.setTimeout(10000);
      await Subscription.subscribe({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(200);
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/app/pulls/31').reply(200, { ...fixtures.pull, ...fixtures.issue, number: 31 });
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/app/issues/31').reply(200, fixtures.issue);
      nock('https://api.github.com').get('/repos/github-slack/app/pulls/31/reviews').reply(200, fixtures.reviews);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'pull_request',
        payload: pullRequestPayload,
      });

      nock('https://api.github.com').get('/repos/github-slack/app/pulls/31').reply(200, fixtures.pull);

      nock('https://api.github.com').get('/repos/github-slack/app/pulls/1535/reviews').reply(200, fixtures.reviews);

      nock('https://api.github.com')
        .get(`/repos/github-slack/app/commits/${statusPayload.sha}/status`)
        .reply(200, fixtures.combinedStatus);

      nock('https://api.github.com')
        .get(`/repos/github-slack/app/commits/${statusPayload.sha}/check-runs`)
        .reply(200, {});

      nock('https://slack.com').post('/api/chat.update', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'status',
        payload: statusPayload,
      });
    });

    test('pull request opened followed by checks and no statuses', async () => {
      jest.setTimeout(10000);
      await Subscription.subscribe({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(200);
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/app/pulls/31').reply(200, { ...fixtures.pull, ...fixtures.issue, number: 31 });
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/app/issues/31').reply(200, fixtures.issue);
      nock('https://api.github.com').get('/repos/github-slack/app/pulls/31/reviews').reply(200, fixtures.reviews);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'pull_request',
        payload: pullRequestPayload,
      });

      nock('https://api.github.com').get('/repos/github-slack/app/pulls/31').reply(200, fixtures.pull);

      nock('https://api.github.com').get('/repos/github-slack/app/pulls/1535/reviews').reply(200, fixtures.reviews);

      nock('https://api.github.com')
        .get(`/repos/github-slack/app/commits/${statusPayload.sha}/status`)
        .reply(200, {});

      nock('https://api.github.com')
        .get(`/repos/github-slack/app/commits/${statusPayload.sha}/check-runs`)
        .reply(200, fixtures.checks);

      nock('https://slack.com').post('/api/chat.update', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'check_run',
        payload: checkPayload,
      });
    });

    test('status event with no matching PR does not update a message', async () => {
      await Subscription.subscribe({
        githubId: statusPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${statusPayload.repository.id}`).reply(200);

      await probot.receive({
        name: 'status',
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
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${publicEventPayload.repository.id}`).reply(200);
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'public',
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
        type: 'repo',
        settings: parseSettings(['branches']),
      });

      nock('https://api.github.com').get(`/repositories/${branchDeleted.repository.id}`).reply(200);
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'delete',
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
        type: 'repo',
      });

      await probot.receive({
        name: 'delete',
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
        type: 'repo',
        settings: parseSettings(['reviews']),
      });

      nock('https://api.github.com')
        .get(`/repositories/${reviewApproved.repository.id}`)
        .reply(200);

      nock('https://api.github.com')
        .get('/repos/github-slack/public-test/pulls/19/reviews/97014958')
        .reply(200, { ...reviewApproved.review, body_html: 'rendered html', state: 'APPROVED' });

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'pull_request_review',
        payload: reviewApproved,
      });

      nock('https://api.github.com')
        .get('/repos/github-slack/public-test/pulls/19/reviews/97014958')
        .reply(200, { ...reviewApproved.review, body_html: 'updated html' });

      nock('https://slack.com').post('/api/chat.update', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'pull_request_review',
        payload: reviewApproved,
      });
    });

    test('review event does not get delivered if not explicitly enabled', async () => {
      await Subscription.subscribe({
        githubId: reviewApproved.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      await probot.receive({
        name: 'pull_request_review',
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
        type: 'repo',
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
        name: 'deployment_status',
        payload: deploymentStatusPendingPayload,
      });

      await probot.receive({
        name: 'deployment_status',
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
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(404);
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'pull_request',
        payload: pullRequestPayload,
      });

      expect(await Subscription.lookup(repositoryDeleted.organization.id)).toHaveLength(0);
      expect(await DeletedSubscription.findAll({
        where: { githubId: pullRequestPayload.repository.id, reason: 'subscription creator lost access' },
      })).toHaveLength(1);
    });

    test('do not post prompt to re-subscribe after user loses access to repo but the subscription is to an account', async () => {
      await Subscription.subscribe({
        githubId: pullRequestPayload.repository.owner.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'account',
      });

      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(404);

      await probot.receive({
        name: 'pull_request',
        payload: pullRequestPayload,
      });
    });

    test('update githubName in account subscription', async () => {
      await Subscription.subscribe({
        githubId: pullRequestPayload.repository.owner.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'account',
      });

      nock('https://api.github.com').get(`/repositories/${pullRequestPayload.repository.id}`).reply(200, pullRequestPayload.repository);
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/app/pulls/31').reply(200, { ...fixtures.issue, ...fixtures.pull });
      nock('https://api.github.com').get('/repos/github-slack/app/pulls/1535/reviews').reply(200, fixtures.reviews);
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'pull_request',
        payload: pullRequestPayload,
      });

      const subs = await Subscription.lookup(pullRequestPayload.repository.owner.id);
      expect(subs).toHaveLength(1);
      expect(subs[0].githubName).toBe('github-slack');
    });

    test('message still gets delivered if no creatorId is set on Subscription', async () => {
      const subscription = await Subscription.subscribe({
        githubId: pullRequestPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
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
      }).get('/repos/github-slack/app/pulls/31').reply(200, { ...fixtures.issue, ...fixtures.pull });
      nock('https://api.github.com').get('/repos/github-slack/app/pulls/1535/reviews').reply(200, fixtures.reviews);

      await probot.receive({
        name: 'pull_request',
        payload: pullRequestPayload,
      });
    });

    test('does not deliver issue comments if not explicitly enabled', async () => {
      const commentPayload = fixtures.github.webhooks.issue_comment;

      await Subscription.subscribe({
        githubId: commentPayload.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      // Should not trigger any deliveries
      await probot.receive({
        name: 'issue_comment',
        payload: commentPayload,
      });
    });

    test('does not deliver commit comments if not explicitly enabled', async () => {
      const commentPayload = fixtures.github.webhooks.commit_comment;

      await Subscription.subscribe({
        githubId: commentPayload.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      // Should not trigger any deliveries
      await probot.receive({
        name: 'commit_comment',
        payload: commentPayload,
      });
    });

    test('with comments enabled (commit)', async () => {
      const commentPayload = fixtures.github.webhooks.commit_comment;
      const commitPayload = fixtures.github.webhooks.commit;

      await Subscription.subscribe({
        githubId: commentPayload.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
        settings: parseSettings(['comments']), // Turn on comments
      });

      nock('https://api.github.com').get(`/repositories/${commentPayload.repository.id}`).reply(200);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      nock('https://api.github.com')
        .get(`/repos/artnez/environment/comments/${commentPayload.comment.id}`)
        .reply(200, { ...commentPayload.comment });

      nock('https://api.github.com')
        .get(`/repos/artnez/environment/git/commits/${commentPayload.comment.commit_id}`)
        .reply(200, { ...commitPayload });

      await probot.receive({
        name: 'commit_comment',
        payload: commentPayload,
      });
    });

    // test('with comments enabled (issue)', async () => {
    //   const commentPayload = fixtures.github.webhooks.issue_comment;

    //   await Subscription.subscribe({
    //     githubId: commentPayload.repository.id,
    //     channelId: 'C002',
    //     slackWorkspaceId: workspace.id,
    //     installationId: installation.id,
    //     creatorId: slackUser.id,
    //     type: 'repo',
    //     settings: ['comments'], // Turn on comments
    //   });

    //   nock('https://slack.com').post('/api/chat.postMessage', (body) => {
    //     expect(body).toMatchSnapshot();
    //     return true;
    //   }).reply(200, { ok: true });

    //   nock('https://api.github.com')
    //     .get(`/repositories/${commentPayload.repository.id}`)
    //     .reply(200, commentPayload.repository);

    //   nock('https://api.github.com')
    //     .get(`/repos/github-slack/test/issues/comments/${commentPayload.comment.id}`)
    //     .reply(200, { ...commentPayload.comment, body_html: 'rendered html' });

    //   await probot.receive({
    //     name: 'issue_comment',
    //     payload: commentPayload,
    //   });
    // });

    // test('comments are updated when edited', async () => {
    //   const commentPayload = fixtures.github.webhooks.issue_comment;

    //   await Subscription.subscribe({
    //     githubId: commentPayload.repository.id,
    //     channelId: 'C002',
    //     slackWorkspaceId: workspace.id,
    //     installationId: installation.id,
    //     creatorId: slackUser.id,
    //     type: 'repo',
    //     settings: ['comments'], // Turn on comments
    //   });

    //   nock('https://slack.com').post('/api/chat.postMessage').reply(200, { ok: true });

    //   nock('https://api.github.com')
    //     .get(`/repositories/${commentPayload.repository.id}`)
    //     .reply(200, commentPayload.repository);

    //   nock('https://api.github.com')
    //     .get(`/repos/github-slack/test/issues/comments/${commentPayload.comment.id}`)
    //     .reply(200, { ...commentPayload.comment, body_html: 'rendered html' });

    //   await probot.receive({
    //     name: 'issue_comment',
    //     payload: commentPayload,
    //   });

    //   nock('https://api.github.com')
    //     .get(`/repos/github-slack/test/issues/comments/${commentPayload.comment.id}`)
    //     .reply(200, { ...commentPayload.comment, body_html: 'edited html' });

    //   nock('https://slack.com').post('/api/chat.update', (body) => {
    //     expect(body).toMatchSnapshot();
    //     return true;
    //   }).reply(200, { ok: true });

    //   await probot.receive({
    //     name: 'issue_comment',
    //     payload: {
    //       ...commentPayload,
    //       action: 'edited',
    //       comment: {
    //         ...commentPayload.comment,
    //         body: 'an edit',
    //       },
    //     },
    //   });
    // });

    test('does not deliver pushes on non-default branch if not explicitly enabled', async () => {
      nock('https://api.github.com').get(`/repositories/${pushNonDefaultBranchPayload.repository.id}`).reply(200);

      await Subscription.subscribe({
        githubId: pushNonDefaultBranchPayload.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      // Should not trigger any deliveries
      await probot.receive({
        name: 'push',
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
        type: 'repo',
        settings: parseSettings(['commits:all']),
      });

      await probot.receive({
        name: 'push',
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
        type: 'repo',
        settings: parseSettings(['commits:all']),
      });

      await probot.receive({ name: 'push', payload });
    });

    test('delivers force push with no commits', async () => {
      const payload = { ...pushPayload, commits: [], forced: true };

      nock('https://api.github.com').get(`/repositories/${payload.repository.id}`).reply(200);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await Subscription.subscribe({
        githubId: payload.repository.id,
        channelId: 'C002',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
        settings: parseSettings(['commits:all']),
      });

      await probot.receive({ name: 'push', payload });
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
        type: 'repo',
        settings: parseSettings(['reviews']),
      });

      await probot.receive({ name: 'pull_request_review', payload });
    });

    test('delivers pull request review commments if comments are enabled', async () => {
      await Subscription.subscribe({
        githubId: reviewCommentCreated.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
        settings: parseSettings(['comments']),
      });

      nock('https://api.github.com').get(`/repositories/${reviewCommentCreated.repository.id}`).reply(200);
      nock('https://api.github.com')
        .get('/repos/github-slack-test-org/test2/pulls/comments/171608320')
        .reply(200, { ...reviewCommentCreated.comment, body_html: 'rendered html' });

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'pull_request_review_comment',
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
        type: 'repo',
      });

      // Should not trigger any deliveries
      await probot.receive({
        name: 'issue_comment',
        payload: reviewCommentCreated,
      });
    });

    test('repository.deleted posts to channel and deletes repository subcription', async () => {
      repositoryDeleted.repository.updated_at = moment().subtract(2, 'months');
      await Subscription.subscribe({
        githubId: repositoryDeleted.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      expect((await Subscription.lookup(repositoryDeleted.repository.id)).length).toBe(1);
      expect((await DeletedSubscription.findAll({
        where: { githubId: repositoryDeleted.repository.id },
      })).length).toBe(0);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'repository',
        payload: repositoryDeleted,
      });

      expect((await Subscription.lookup(repositoryDeleted.repository.id)).length).toBe(0);
      expect((await DeletedSubscription.findAll({
        where: { githubId: repositoryDeleted.repository.id, reason: 'repository deleted' },
      })).length).toBe(1);
    });

    test('repository.deleted posts to channel and does not delete account subscription', async () => {
      repositoryDeleted.repository.updated_at = moment().subtract(2, 'months');
      await Subscription.subscribe({
        githubId: repositoryDeleted.organization.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'account',
      });

      expect((await Subscription.lookup(repositoryDeleted.organization.id)).length).toBe(1);
      expect((await DeletedSubscription.findAll({
        where: { githubId: repositoryDeleted.repository.id },
      })).length).toBe(0);

      await probot.receive({
        name: 'repository',
        payload: repositoryDeleted,
      });

      expect((await Subscription.lookup(repositoryDeleted.organization.id)).length).toBe(1);
      expect((await DeletedSubscription.findAll({
        where: { githubId: repositoryDeleted.repository.id },
      })).length).toBe(0);
    });

    test('delivers release notes by default', async () => {
      await Subscription.subscribe({
        githubId: releasePublishedPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${releasePublishedPayload.repository.id}`).reply(200);
      nock('https://api.github.com').get('/repos/github-slack/app/releases/10558008').reply(200, fixtures.release);

      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'release',
        payload: releasePublishedPayload,
      });
    });

    test('does not deliver release notes if explicitely disabled', async () => {
      const subscription = await Subscription.subscribe({
        githubId: releasePublishedPayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });
      subscription.disable(parseSettings('releases'));
      await subscription.save();


      await probot.receive({
        name: 'release',
        payload: releasePublishedPayload,
      });
    });

    test('channel_not_found error from slack deletes subscription', async () => {
      const subscription = await Subscription.subscribe({
        githubId: issuePayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${issuePayload.repository.id}`).reply(200, {
        full_name: issuePayload.repository.full_name,
      });
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/public-test/issues/1').reply(200, fixtures.issue);

      nock('https://slack.com').post('/api/chat.postMessage')
        .reply(200, { ok: false, error: 'channel_not_found' });

      await probot.receive({
        name: 'issues',
        payload: issuePayload,
      });

      expect(await Subscription.findById(subscription.id)).toBe(null);
    });

    test('other error from slack does not delete subscription', async () => {
      const subscription = await Subscription.subscribe({
        githubId: issuePayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      nock('https://api.github.com').get(`/repositories/${issuePayload.repository.id}`).reply(200, {
        full_name: issuePayload.repository.full_name,
      });
      nock('https://api.github.com', {
        reqHeaders: {
          Accept: 'application/vnd.github.html+json',
        },
      }).get('/repos/github-slack/public-test/issues/1').reply(200, fixtures.issue);

      nock('https://slack.com').post('/api/chat.postMessage')
        .reply(200, { ok: false, error: 'some_other_error' });

      // Close your eyes, little probot. You do not want to see what is to come
      probot.logger.level('fatal');

      await expect(probot.receive({
        name: 'issues',
        payload: issuePayload,
      })).rejects.toThrow();

      expect(await subscription.reload()).toEqual(subscription);
    });

    test('nothing to do if githubId == repoId but the subscription is for accounts', async () => {
      await Subscription.subscribe({
        githubId: issuePayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'account',
      });

      await probot.receive({
        name: 'issues',
        payload: issuePayload,
      });

      // nock pending requests should be empty at this point
    });

    test('nothing to do if githubId == ownerId but the subscription is for repos', async () => {
      await Subscription.subscribe({
        githubId: issuePayload.repository.owner.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      await probot.receive({
        name: 'issues',
        payload: issuePayload,
      });

      // nock pending requests should be empty at this point
    });

    test('deliver issue if it has subscribed label', async () => {
      await Subscription.subscribe({
        githubId: issuePayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
        settings: parseSettings('+label:enhancement'),
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
        name: 'issues',
        payload: issuePayload,
      });
    });

    test('does not deliver issue if it does not have subscribed label', async () => {
      await Subscription.subscribe({
        githubId: issuePayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
        settings: parseSettings(['+label:todo']),
      });

      nock('https://api.github.com').get(`/repositories/${issuePayload.repository.id}`).reply(200, {
        full_name: issuePayload.repository.full_name,
      });

      // Should not post message to slack
      await probot.receive({
        name: 'issues',
        payload: issuePayload,
      });
    });

    test('deliver issue if it unsubscribed label', async () => {
      const subscription = await Subscription.subscribe({
        githubId: issuePayload.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
        settings: parseSettings(['+label:todo']),
      });

      subscription.disable(parseSettings(['+label:todo']));
      await subscription.save();

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
        name: 'issues',
        payload: issuePayload,
      });
    });

    test('gollum event', async () => {
      await Subscription.subscribe({
        githubId: gollumEvent.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
        settings: parseSettings(['wiki_changes']),
      });

      nock('https://api.github.com').get(`/repositories/${gollumEvent.repository.id}`).reply(200);
      nock('https://slack.com').post('/api/chat.postMessage', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await probot.receive({
        name: 'gollum',
        payload: gollumEvent,
      });
    });

    test('gollum event does not get delivered if not explicitly enabled', async () => {
      await Subscription.subscribe({
        githubId: gollumEvent.repository.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
        type: 'repo',
      });

      await probot.receive({
        name: 'gollum',
        payload: gollumEvent,
      });
    });
  });
});
