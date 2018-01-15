const request = require('supertest');

const { authenticate } = require('../../../lib/slack/middleware');

const { models, createApp } = require('.');
const fixtures = require('../../fixtures');

const { SlackWorkspace, SlackUser, GitHubUser } = models;

describe('Middleware: authenticate', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    app.use(authenticate((req, res) => {
      res.status(403).send('Nope');
    }));

    app.get('/', (req, res) => {
      res.json({ user: res.locals.slackUser.id });
    });
  });

  describe('without an existing user', () => {
    test('authenticates command', async () => {
      const command = fixtures.slack.command();
      await request(app).get('/').send(command).expect(403);
    });

    test('authenticates event', async () => {
      const event = fixtures.slack.link_shared();
      await request(app).get('/').send(event).expect(403);
    });
  });

  describe('with an existing user', () => {
    let workspace;
    let slackUser;
    let githubUser;

    beforeEach(async () => {
      workspace = await SlackWorkspace.create({
        slackId: 'T0001',
        accessToken: 'test',
      });

      githubUser = await GitHubUser.create({
        id: 1,
        accessToken: 'test',
      });

      slackUser = await SlackUser.create({
        slackId: 'U0001',
        slackWorkspaceId: workspace.id,
        githubId: githubUser.id,
      });
    });

    test('authenticates command', async () => {
      const command = fixtures.slack.command({
        team_id: workspace.slackId,
        user_id: slackUser.slackId,
      });

      await request(app).get('/').send(command).expect(200, { user: slackUser.id });
    });

    test('authenticates event', async () => {
      const event = fixtures.slack.link_shared({ team_id: workspace.slackId });
      event.event.user = slackUser.slackId;

      await request(app).get('/').send(event).expect(200);
    });
  });
});
