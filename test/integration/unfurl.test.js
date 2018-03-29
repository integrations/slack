

const request = require('supertest');
const nock = require('nock');
const moment = require('moment');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

describe('Integration: unfurls', () => {
  beforeEach(async () => {
    const { SlackWorkspace } = models;
    await SlackWorkspace.create({
      slackId: 'T000A',
      accessToken: 'xoxa-token',
    });
  });

  test('issue', async () => {
    nock('https://api.github.com').get('/repos/bkeepers/dotenv').reply(
      200,
      {
        ...fixtures.repo,
        updated_at: moment().subtract(2, 'months'),
      },
    );

    nock('https://slack.com').post('/api/chat.unfurl', (body) => {
      // Test that the body posted to the unfurl matches the snapshot
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
      .expect(200);
  });

  test('only unfurls link first time a link is shared', async () => {
    // It should only make one request to this
    nock('https://api.github.com').get('/repos/bkeepers/dotenv').reply(
      200,
      {
        ...fixtures.repo,
        updated_at: moment().subtract(2, 'months'),
      },
    );

    // And it should only make one request to this
    nock('https://slack.com').post('/api/chat.unfurl', (body) => {
      // Test that the body posted to the unfurl matches the snapshot
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    // Perform the unfurl
    await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
      .expect(200);

    // Second unfurl does not make additional API requests
    await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
      .expect(200);
  });

  test('does minor unfurl if 2 links are shared', async () => {
    nock('https://api.github.com').get('/repos/facebook/react').reply(200, fixtures.repo);
    nock('https://api.github.com').get('/repos/facebook/react/issues/10191').reply(200, fixtures.issue);
    nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.repo);
    nock('https://api.github.com').get('/repos/atom/atom/issues/16292').reply(200, fixtures.issue);

    nock('https://slack.com').post('/api/chat.unfurl', (req) => {
      // Test that the body posted to the unfurl matches the snapshot
      expect(req).toMatchSnapshot();
      const unfurls = JSON.parse(req.unfurls);
      expect(unfurls['https://github.com/facebook/react/issues/10191'].text).toBe(undefined);
      return true;
    }).reply(200, { ok: true });

    const body = fixtures.slack.link_shared();

    body.event.links = [
      { domain: 'github.com', url: 'https://github.com/facebook/react/issues/10191' },
      { domain: 'github.com', url: 'https://github.com/atom/atom/issues/16292' },
    ];

    await request(probot.server).post('/slack/events').send(body).expect(200);
  });

  test('does not unfurl if more than 2 links', async () => {
    const body = fixtures.slack.link_shared();

    body.event.links = [
      { domain: 'github.com', url: 'https://github.com/bkeepers/dotenv' },
      { domain: 'github.com', url: 'https://github.com/atom/atom' },
      { domain: 'github.com', url: 'https://github.com/probot/probot' },
    ];

    // No API requests should be made when this request is performed
    return request(probot.server).post('/slack/events').send(body).expect(200);
  });

  test('gracefully handles not found link', async () => {
    // Silence error logs for this test
    probot.logger.level('fatal');

    nock('https://api.github.com').get('/repos/bkeepers/dotenv').reply(404);

    await request(probot.server).post('/slack/events')
      .send(fixtures.slack.link_shared())
      .expect(200);
  });

  test('gracefully handles unknown resources', async () => {
    // Silence error logs for this test
    probot.logger.level('fatal');

    const payload = fixtures.slack.link_shared();
    payload.event.links[0].url = 'https://github.com/probot/probot/issues';

    await request(probot.server).post('/slack/events').send(payload)
      .expect(200);
  });

  test('renders 500 when other error happens', async () => {
    // Silence error logs for this test
    probot.logger.level('fatal');

    nock('https://api.github.com').get('/repos/bkeepers/dotenv').reply(500);

    await request(probot.server).post('/slack/events')
      .send(fixtures.slack.link_shared())
      .expect(500);
  });
});
