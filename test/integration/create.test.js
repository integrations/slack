const request = require('supertest');
const nock = require('nock');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const {
  SlackUser,
  GitHubUser,
  Subscription,
  Installation,
} = models;

describe('Integration: Creating issues from Slack', () => {
  let workspace;
  let githubUser;
  let slackUser;
  let installation;
  beforeEach(async () => {
    const { SlackWorkspace } = models;
    workspace = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxa-token',
    });

    githubUser = await GitHubUser.create({
      id: 1,
      accessToken: 'secret',
    });

    slackUser = await SlackUser.create({
      slackId: 'U2147483697', // same as in fixtures.slack.command
      slackWorkspaceId: workspace.id,
      githubId: githubUser.id,
    });

    installation = await Installation.create({
      githubId: 1,
      ownerId: 1337,
    });
  });
  test('works in channel with one subscription', async () => {
    await Subscription.subscribe({
      creatorId: slackUser.id,
      slackWorkspaceId: workspace.id,
      githubId: 54321,
      channelId: 'C2147483705',
      installationId: installation.id,
    });

    nock('https://api.github.com').get('/repositories/54321').reply(200, {
      full_name: 'kubernetes/kubernetes',
    });

    nock('https://slack.com').post('/api/dialog.open', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    const command = fixtures.slack.command({
      text: 'new issue',
    });

    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });

    nock('https://api.github.com').get('/repositories/54321').reply(200, {
      name: 'kubernetes',
      owner: {
        login: 'kubernetes',
      },
    });

    nock('https://api.github.com').post('/repos/kubernetes/kubernetes/issues').reply(200);

    // User submits dialog to open issue
    await request(probot.server).post('/slack/actions').send({
      payload: JSON.stringify(fixtures.slack.action.dialogSubmissionSingleRepo()),
    })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });

  test('works in channel with multiple subscriptions', async () => {
    await Subscription.subscribe({
      creatorId: slackUser.id,
      slackWorkspaceId: workspace.id,
      githubId: 54321,
      channelId: 'C2147483705',
      installationId: installation.id,
    });

    await Subscription.subscribe({
      creatorId: slackUser.id,
      slackWorkspaceId: workspace.id,
      githubId: 654321,
      channelId: 'C2147483705',
      installationId: installation.id,
    });

    nock('https://api.github.com').get('/repositories/54321').reply(200, {
      full_name: 'kubernetes/kubernetes',
    });

    nock('https://api.github.com').get('/repositories/654321').reply(200, {
      full_name: 'atom/atom',
    });

    nock('https://slack.com').post('/api/dialog.open', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    const command = fixtures.slack.command({
      text: 'new issue',
    });

    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });

    nock('https://api.github.com').get('/repositories/54321').reply(200, {
      name: 'kubernetes',
      owner: {
        login: 'kubernetes',
      },
    });

    nock('https://api.github.com').post('/repos/kubernetes/kubernetes/issues').reply(200);

    // User submits dialog to open issue
    await request(probot.server).post('/slack/actions').send({
      payload: JSON.stringify(fixtures.slack.action.dialogSubmissionRepoSelection()),
    })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });
});
