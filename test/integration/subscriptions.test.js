const request = require('supertest');
const nock = require('nock');

const helper = require('.');
const fixtures = require('../fixtures');

describe('Integration: subscriptions', () => {
  beforeEach(async () => {
    // Create an installation
    await helper.robot.models.Installation.create({
      githubId: 1,
      ownerId: fixtures.org.id,
    });

    nock.cleanAll();
  });

  test('successfully subscribing and unsubscribing to a repository', async () => {
    const { probot } = helper;

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
    const { probot } = helper;

    nock('https://api.github.com').get('/orgs/atom').reply(200, fixtures.org);
    nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.repo);

    const command = fixtures.slack.command({ text: 'subscribe atom/atom' });

    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });

  test('subscribing with a bad url', async () => {
    const { probot } = helper;

    const command = fixtures.slack.command({ text: 'subscribe wat?' });

    const req = request(probot.server).post('/slack/command').send(command);

    await req.expect(200).expect((res) => {
      expect(res.body).toMatchSnapshot();
    });
  });
});
