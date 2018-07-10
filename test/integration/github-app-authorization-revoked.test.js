/*
Test cases:
- GitHubUser with one Slack user and multiple subscriptions
- GitHubUser with multiple Slack users and multiple subscriptions

expect that:
- all subscriptions by github user are deleted across multiple workspaces
- expect githubId field to be null for all SlackUsers attached to githubUser
- expect that a slack message is posted in each channel
*/
const nock = require('nock');
const Sequelize = require('sequelize');


const { probot, models } = require('.');
const githubAppAuthorizationRevoked = require('../fixtures/webhooks/github_app_authorization.revoked.json');

const { Op } = Sequelize;
const {
  SlackWorkspace,
  GitHubUser,
  SlackUser,
  Installation,
  Subscription,
} = models;

describe('Integration: github_app_authorization.revoked', async () => {
  let workspace;
  let githubUser;
  let slackUser;
  let installation1;
  let installation2;
  beforeEach(async () => {
    // create workspace
    workspace = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxp-token',
    });

    githubUser = await GitHubUser.create({
      id: 1,
      accessToken: 'secret',
    });

    slackUser = await SlackUser.create({
      slackId: 'U2147483697',
      slackWorkspaceId: workspace.id,
      githubId: githubUser.id,
    });

    installation1 = await Installation.create({
      githubId: 1,
      ownerId: 1,
    });

    installation2 = await Installation.create({
      githubId: 2,
      ownerId: 2,
    });

    await Subscription.subscribe({
      channelId: 'C2147483705',
      githubId: 1,
      installationId: installation1.id,
      slackWorkspaceId: workspace.id,
      creatorId: slackUser.id,
    });

    await Subscription.subscribe({
      channelId: 'C2147483705',
      githubId: 2,
      installationId: installation2.id,
      slackWorkspaceId: workspace.id,
      creatorId: slackUser.id,
    });

    await Subscription.subscribe({
      channelId: 'C12345',
      githubId: 3,
      installationId: installation2.id,
      slackWorkspaceId: workspace.id,
      creatorId: slackUser.id,
    });
  });

  test('works for a user  who has connected their GitHub account to one Slack workspace', async () => {
    nock('https://api.github.com').get('/repositories/1').reply(200, {
      full_name: 'atom/atom',
    });

    nock('https://api.github.com').get('/repositories/2').reply(200, {
      full_name: 'kubernetes/kubernetes',
    });

    nock('https://api.github.com').get('/repositories/3').reply(200, {
      full_name: 'integrations/slack',
    });

    nock('https://slack.com').post('/api/chat.postMessage', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).times(2).reply(200, { ok: true });

    await probot.receive({
      event: 'github_app_authorization',
      payload: githubAppAuthorizationRevoked,
    });

    expect((await slackUser.reload()).githubId).toBe(null);
    expect((await Subscription.findAll({ where: { creatorId: slackUser.id } })).length).toBe(0);
  });
  test('works for a user who has connected their GitHub account to multiple Slack workspaces', async () => {
    const workspace2 = await SlackWorkspace.create({
      slackId: 'T0002',
      accessToken: 'xoxp-token2',
    });
    const slackUser2 = await SlackUser.create({
      slackId: 'U123456',
      slackWorkspaceId: workspace.id,
      githubId: githubUser.id,
    });
    await Subscription.subscribe({
      channelId: 'C12121212',
      githubId: 3,
      installationId: installation2.id,
      slackWorkspaceId: workspace2.id,
      creatorId: slackUser2.id,
    });

    await Subscription.subscribe({
      channelId: 'C9999999',
      githubId: 2,
      installationId: installation2.id,
      slackWorkspaceId: workspace2.id,
      creatorId: slackUser2.id,
    });

    nock('https://api.github.com').get('/repositories/1').reply(200, {
      full_name: 'atom/atom',
    });

    nock('https://api.github.com').get('/repositories/2').times(2).reply(200, {
      full_name: 'kubernetes/kubernetes',
    });

    nock('https://api.github.com').get('/repositories/3').times(2).reply(200, {
      full_name: 'integrations/slack',
    });

    nock('https://slack.com').post('/api/chat.postMessage', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).times(4).reply(200, { ok: true });

    await probot.receive({
      event: 'github_app_authorization',
      payload: githubAppAuthorizationRevoked,
    });

    expect((await slackUser.reload()).githubId).toBe(null);
    expect((await slackUser2.reload()).githubId).toBe(null);
    expect((await Subscription.findAll({
      where: {
        creatorId: {
          [Op.or]: [slackUser.id, slackUser2.id],
        },
      },
    })).length).toBe(0);
  });
});
