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
  });

  test('successfully subscribing to a repository', async () => {
    const { probot } = helper;

    const requests = {
      account: nock('https://api.github.com').get('/orgs/atom').reply(200, fixtures.org),
      repo: nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.repo),
    };

    const command = fixtures.slack.command({
      text: 'subscribe https://github.com/atom/atom',
    });

    const req = request(probot.server).post('/slack/command').send(command);

    await req.expect(200).expect((res) => {
      expect(res.body).toMatchSnapshot();
    });

    expect(requests.account.isDone()).toBe(true);
    expect(requests.repo.isDone()).toBe(true);
  });

  test('subsscribing with a bad url', async () => {
    const { probot } = helper;

    const command = fixtures.slack.command({ text: 'subscribe wat?' });

    const req = request(probot.server).post('/slack/command').send(command);

    await req.expect(200).expect((res) => {
      expect(res.body).toMatchSnapshot();
    });
  });
});
