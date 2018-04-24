const request = require('supertest');
const nock = require('nock');
const moment = require('moment');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const {
  SlackUser,
  GitHubUser,
  Unfurl,
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
      slackId: 'T000A',
      accessToken: 'xoxa-token',
    });

    githubUser = await GitHubUser.create({
      id: 1,
      accessToken: 'secret',
    });

    slackUser = await SlackUser.create({
      slackId: 'U88HS', // same as in link_shared.js
      slackWorkspaceId: workspace.id,
      githubId: githubUser.id,
    });

    installation = await Installation.create({
      githubId: 1,
      ownerId: 1337,
    });
  });
  test('Works in channel with one subscription', async () => {
    await Subscription.subscribe({
      creatorId: slackUser.id,
      slackWorkspaceId: workspace.id,
      githubId: 54321,
      channelId: 'C74M',
      installationId: installation.id,
    });

    // /github new command sent
    // dialog payload sent
    // relevant nock stuff
  });

  test('Works in channel with multiple subscriptions', async () => {

  });
});
