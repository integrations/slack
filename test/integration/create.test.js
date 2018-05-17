const request = require('supertest');
const nock = require('nock');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const {
  SlackUser,
  GitHubUser,
  Installation,
} = models;

describe('Integration: Creating issues from Slack', () => {
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
  test('works when specifying a repository', async () => {
    nock('https://api.github.com').get('/repos/kubernetes/kubernetes/installation').reply(200, {
      id: 1337,
      account: {
        id: 1,
      },
    });

    nock('https://api.github.com').get('/repos/kubernetes/kubernetes').reply(200, {
      full_name: 'kubernetes/kubernetes',
      id: 54321,
    });

    nock('https://slack.com').post('/api/dialog.open', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    const command = fixtures.slack.command({
      text: 'open kubernetes/kubernetes',
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
});
