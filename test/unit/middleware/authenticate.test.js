const request = require('supertest');

const { authenticate } = require('../../../lib/slack/middleware');

const { models, createApp } = require('.');
const fixtures = require('../../fixtures');

const { SlackWorkspace, SlackUser, GitHubUser } = models;

describe('Middleware: authenticate', () => {
  let app;

  beforeEach(() => {
    app = createApp();

    app.get(
      '/workspace',
      authenticate((req, res, next) => next()),
      (req, res) => {
        res.json({ workspace: res.locals.slackWorkspace.slackId });
      },
    );

    app.get(
      '/user-required',
      authenticate((req, res) => res.status(403).send('Nope')),
      (req, res) => res.json({ user: res.locals.slackUser.id }),
    );

    app.use((err, req, res, next) => {
      res.status(500).send(err.message);
    });
  });

  describe('with a workspace', () => {
    let workspace;

    beforeEach(async () => {
      workspace = await SlackWorkspace.create({
        slackId: 'T0001',
        accessToken: 'test',
      });
    });

    test('authenticates command', async () => {
      const command = fixtures.slack.command({
        team_id: workspace.slackId,
      });

      await request(app).get('/workspace').send(command).expect(200, {
        workspace: workspace.slackId,
      });
    });

    describe('with an existing user', () => {
      let slackUser;
      let githubUser;

      beforeEach(async () => {
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

        await request(app).get('/user-required').send(command).expect(200, { user: slackUser.id });
      });

      test('authenticates event', async () => {
        const event = fixtures.slack.link_shared({ team_id: workspace.slackId });
        event.event.user = slackUser.slackId;

        await request(app).get('/user-required').send(event).expect(200);
      });
    });

    describe('without an existing user', () => {
      test('authenticates command', async () => {
        const command = fixtures.slack.command({ team_id: workspace.slackId });
        await request(app).get('/user-required').send(command).expect(403);
      });

      test('authenticates event', async () => {
        const event = fixtures.slack.link_shared({ team_id: workspace.slackId });
        await request(app).get('/user-required').send(event).expect(403);
      });
    });
  });

  describe('without a workspace', () => {
    test('blows up', async () => {
      const command = fixtures.slack.command();
      await request(app).get('/workspace').send(command)
        .expect(500, 'Workspace for T0001 not found. Is the app installed?');
    });
  });
});
