const request = require('supertest');
const nock = require('nock');

const helper = require('.');
const fixtures = require('../fixtures');

const { probot } = helper;

describe('Integration: subscriptions', () => {
  describe('with GitHub App installed', () => {
    beforeEach(async () => {
      // Create an installation
      await helper.robot.models.Installation.create({
        githubId: 1,
        ownerId: fixtures.org.id,
      });
    });

    test('successfully subscribing and unsubscribing to a repository', async () => {
      nock('https://api.github.com').get('/orgs/atom').times(2).reply(200, fixtures.org);
      nock('https://api.github.com').get('/repos/atom/atom').times(2).reply(200, fixtures.repo);

      const command = fixtures.slack.command({
        text: 'subscribe https://github.com/atom/atom',
      });

      await request(probot.server).post('/slack/command').send(command)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });

      const unsubscribeCommand = fixtures.slack.command({
        text: 'unsubscribe https://github.com/atom/atom',
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

      const command = fixtures.slack.command({ text: 'subscribe atom/atom' });

      await request(probot.server).post('/slack/command').send(command)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    test('subsscribing with a bad url', async () => {
      const command = fixtures.slack.command({ text: 'subscribe wat?' });

      await request(probot.server).post('/slack/command').send(command)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
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
});
