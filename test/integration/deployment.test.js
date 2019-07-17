const request = require('supertest');
const nock = require('nock');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const {
  SlackUser,
  GitHubUser,
  Installation,
} = models;

describe('Integration: Creating and listing deployments from Slack', () => {
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
    jest.setTimeout(10000);
    nock('https://api.github.com').get('/repos/kubernetes/kubernetes').reply(200, {
      full_name: 'kubernetes/kubernetes',
      id: 54321,
    });
    nock('https://api.github.com').get('/repos/kubernetes/kubernetes/branches').reply(200, fixtures.branches);
    nock('https://api.github.com').get('/repos/kubernetes/kubernetes/git/refs/tags').reply(200, fixtures.tags);

    nock('https://slack.com').post('/api/dialog.open', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    const command = fixtures.slack.command({
      text: 'deploy kubernetes/kubernetes',
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

    nock('https://api.github.com').post('/repos/kubernetes/kubernetes/deployments').reply(200, {
      ref: 'refs/tags/v1.0',
      task: 'deploy',
      environment: 'production',
      node_id: 'MDEwOkRlcGxveW1lbnQxMzc1ODM5ODE=',
    });

    nock('https://api.github.com').post('/graphql').reply(200, { data: { node: fixtures.deployments.data.repository.deployments.nodes[0] } });

    nock('https://slack.com').post('/api/chat.postMessage', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    // User submits dialog to create a deployment
    await request(probot.server).post('/slack/actions').send({
      payload: JSON.stringify(fixtures.slack.action.dialogSubmissionCreateDeployment()),
    })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });

  test('works when listing deployments', async () => {
    nock('https://api.github.com').post('/graphql').reply(200, fixtures.deployments);

    const command = fixtures.slack.command({
      text: 'deploy kubernetes/kubernetes list',
    });

    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });

  test('informs of no deployments found when listing deployments', async () => {
    nock('https://api.github.com').post('/graphql').reply(200, { data: { repository: { deployments: { nodes: [] } } } });

    const command = fixtures.slack.command({
      text: 'deploy kubernetes/kubernetes list',
    });

    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });

  test('throws error when listing deployments and none are found', async () => {
    nock('https://api.github.com').post('/graphql').reply(404, { errors: [{ type: 'FORBIDDEN' }] });
    nock('https://api.github.com').get('/repos/kubernetes/kubernetes/installation')
      .reply(200, {
        ...fixtures.installation,
        account: fixtures.repo.owner,
        permissions: { },
      });

    const command = fixtures.slack.command({
      text: 'deploy kubernetes/kubernetes list',
    });

    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });
});
