const request = require('supertest');
const nock = require('nock');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const { SlackUser, GitHubUser, Installation } = models;

const repo = 'kubernetes/kubernetes';
const query = (search) => encodeURIComponent(`${search}+repo:${repo}`);

describe('Integration: Searching a repository from Slack', () => {
  let workspace;
  let githubUser;
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

    await SlackUser.create({
      slackId: 'U2147483697', // same as in fixtures.slack.command
      slackWorkspaceId: workspace.id,
      githubId: githubUser.id,
    });

    await Installation.create({
      githubId: 1,
      ownerId: 1337,
    });
  });

  test('works when searching a repository', async () => {
    nock('https://api.github.com').get(`/search/code?q=${query('cron')}`).reply(200, fixtures.searchResult.success);

    const command = fixtures.slack.command({
      text: `search ${repo} cron`,
    });

    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });

  test('informs of no results found', async () => {
    nock('https://api.github.com').get(`/search/code?q=${query('baseball')}`).reply(200, fixtures.searchResult.empty);

    const command = fixtures.slack.command({
      text: `search ${repo} baseball`,
    });

    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });
});
