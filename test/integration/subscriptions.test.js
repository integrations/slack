const request = require('supertest');
const nock = require('nock');

const helper = require('.');
const fixtures = require('../fixtures');

const { probot } = helper;

describe('Integration: subscriptions', () => {
  describe('unauthenticated user', () => {
    test('is prompted to authenticate before subscribing', async () => {
      // User types slash command
      const command = fixtures.slack.command({
        text: 'subscribe https://github.com/kubernetes/kubernetes',
      });
      const req = request(probot.server).post('/slack/command').send(command);
      const res = await req.expect(200);

      // User is shown ephemeral prompt to authenticate
      const prompt = /^<https:\/\/example\.com(\/github\/oauth\/login\?state=(.*))\|Finish connecting your GitHub account>$/;
      const text = res.body.attachments[0].text;
      expect(text).toMatch(prompt);
    });
  });

  describe('authenticated user', () => {
    beforeEach(async () => {
      // create user
      const user = await helper.robot.models.User.create();
      await helper.robot.models.SlackUser.create({
        slackId: 'U2147483697',
        userId: user.id,
      });
      await helper.robot.models.GitHubUser.create({
        githubId: 2,
        userId: user.id,
        accessToken: 'github-token',
      });
    });

    describe('without the GitHub App installed', () => {
      test('prompts to install app', async () => {
        nock('https://api.github.com').get('/app').reply(200, fixtures.app);
        nock('https://api.github.com').get('/orgs/atom').reply(200, fixtures.org);

        const command = fixtures.slack.command({
          text: 'subscribe atom/atom',
        });

        await request(probot.server).post('/slack/command').send(command)
           .expect(200)
           .expect((res) => {
             expect(res.body).toMatchSnapshot();
           });
      });
    });

    describe('with GitHub App installed', () => {
      beforeEach(async () => {
        // Create an installation
        await helper.robot.models.Installation.create({
          githubId: 1,
          ownerId: fixtures.org.id,
        });
      });

      test('successfully subscribing and unsubscribing to a repository', async () => {
        nock('https://api.github.com').get('/orgs/kubernetes').times(2).reply(200, fixtures.org);
        nock('https://api.github.com').get('/repos/kubernetes/kubernetes').times(2).reply(200, fixtures.repo);
        nock('https://api.github.com').get('/repos/kubernetes/kubernetes/pulls?per_page=1').reply(200, {});

        const command = fixtures.slack.command({
          text: 'subscribe https://github.com/kubernetes/kubernetes',
        });

        await request(probot.server).post('/slack/command').send(command)
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });

        const unsubscribeCommand = fixtures.slack.command({
          text: 'unsubscribe https://github.com/kubernetes/kubernetes',
        });

        await request(probot.server).post('/slack/command').send(unsubscribeCommand)
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
      });

      test('successfully subscribing with repository shorthand', async () => {
        nock('https://api.github.com').get('/orgs/atom').reply(200, fixtures.org);
        nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.repo);
        nock('https://api.github.com').get('/repos/atom/atom/pulls?per_page=1').reply(200, {});

        const command = fixtures.slack.command({ text: 'subscribe atom/atom' });

        await request(probot.server).post('/slack/command').send(command)
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
      });


      test('subscribing with a bad url', async () => {
        const command = fixtures.slack.command({
          text: 'subscribe wat?',
        });

        const req = request(probot.server).post('/slack/command').send(command);

        await req.expect(200).expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
      });
    });
  });
});
