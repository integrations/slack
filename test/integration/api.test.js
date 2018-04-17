const supertest = require('supertest');
const nock = require('nock');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const request = supertest.agent(probot.server);

const {
  SlackWorkspace, SlackUser, GitHubUser, Subscription, Installation,
} = models;

describe('Integration: api', () => {
  let installation;
  let workspace;
  let githubUser;
  let slackUser;

  beforeEach(async () => {
    // Create an installation
    installation = await Installation.create({
      githubId: 1,
      ownerId: fixtures.org.id,
    });

    // create user
    githubUser = await GitHubUser.create({
      id: 2,
      accessToken: 'github-token',
    });
    workspace = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxp-token',
    });
    slackUser = await SlackUser.create({
      slackId: 'U2147483697',
      slackWorkspaceId: workspace.id,
      githubId: githubUser.id,
    });

    await Subscription.subscribe({
      githubId: fixtures.repo.id,
      channelId: 'C001',
      slackWorkspaceId: workspace.id,
      installationId: installation.id,
      creatorId: slackUser.id,
    });
  });

  describe('with a valid user token', () => {
    test('posts message if user has push access', async () => {
      nock('https://api.github.com')
        .get('/repos/owner/repo')
        .matchHeader('authorization', 'token test')
        .reply(200, {
          ...fixtures.repo,
          permissions: { push: true },
        });
      nock('https://slack.com').post('/api/chat.postMessage').reply(200, { ok: true });

      await request.post('/repos/owner/repo')
        .set('authorization', 'token test')
        .send({ text: 'hello world' })
        .expect(200, { ok: true });
    });

    test('does not post message if user does not have push access', async () => {
      nock('https://api.github.com')
        .get('/repos/owner/repo')
        .matchHeader('authorization', 'token test')
        .reply(200, {
          ...fixtures.repo,
          permissions: { push: false },
        });

      await request.post('/repos/owner/repo')
        .set('authorization', 'token test')
        .send({ text: 'hello world' })
        .expect(404);
    });
  });

  describe('without authentication', () => {
    test('responds with 401', async () => {
      await request.post('/repos/owner/repo').send({ text: 'hello world' })
        .expect(401);
    });
  });
});
