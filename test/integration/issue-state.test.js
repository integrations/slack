const supertest = require('supertest');
const nock = require('nock');
const { promisify } = require('util');

const { probot, slackbot, models } = require('.');
const fixtures = require('../fixtures');

const request = supertest.agent(probot.server);

const { SlackWorkspace, SlackUser, GitHubUser } = models;

const sleep = promisify(setTimeout);

describe('Integration: issue state', () => {
  let user;
  let workspace;

  beforeEach(async () => {
    process.env.EARLY_ACCESS_CHANNELS = 'C2147483705';

    user = await GitHubUser.create({
      id: 2,
      accessToken: 'github-token',
    });

    workspace = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxa-token',
    });

    await SlackUser.create({
      slackId: 'U2147483697',
      slackWorkspaceId: workspace.id,
      githubId: user.id,
    });
  });

  test('requires early access permissions', async () => {
    delete process.env.EARLY_ACCESS_CHANNELS;

    const command = fixtures.slack.command({
      text: 'close https://github.com/owner/repo/issues/123',
    });

    await request.post('/slack/command').use(slackbot).send(command)
      .expect(200, /help/);
  });

  test('/github close issue', async () => {
    nock('https://api.github.com').get('/repos/owner/repo/installation')
      .reply(200, { id: 1, account: fixtures.repo.owner });
    nock('https://api.github.com')
      .get('/repos/owner/repo')
      .reply(200, fixtures.repo);
    nock('https://api.github.com')
      .get('/user')
      .reply(200, fixtures.user);
    nock('https://api.github.com')
      .patch('/repos/owner/repo/issues/123', { state: 'closed' })
      .reply(200);

    nock('https://slack.com').post('/api/chat.postMessage', (body) => {
      expect(JSON.stringify(body)).toMatch(/Issue closed by wilhelmklopp/);
      return true;
    }).reply(200, { ok: true });

    const command = fixtures.slack.command({
      text: 'close https://github.com/owner/repo/issues/123',
    });

    await request.post('/slack/command').use(slackbot).send(command)
      .expect(200, { response_type: 'in_channel' });

    // wait for request to post to slack after command response
    await sleep(10);
  });

  test('/github reopen issue', async () => {
    nock('https://api.github.com').get('/repos/owner/repo/installation')
      .reply(200, { id: 1, account: fixtures.repo.owner });
    nock('https://api.github.com')
      .get('/repos/owner/repo')
      .reply(200, fixtures.repo);
    nock('https://api.github.com')
      .get('/user')
      .reply(200, fixtures.user);
    nock('https://api.github.com')
      .patch('/repos/owner/repo/issues/123', { state: 'open' })
      .reply(200);

    nock('https://slack.com').post('/api/chat.postMessage', (body) => {
      expect(JSON.stringify(body)).toMatch(/Issue reopened by wilhelmklopp/);
      return true;
    }).reply(200, { ok: true });

    const command = fixtures.slack.command({
      text: 'reopen https://github.com/owner/repo/issues/123',
    });

    await request.post('/slack/command').use(slackbot).send(command)
      .expect(200, { response_type: 'in_channel' });

    // wait for request to post to slack after command response
    await sleep(10);
  });
});
