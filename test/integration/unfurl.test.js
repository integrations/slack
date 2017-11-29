const request = require('supertest');
const nock = require('nock');

const { probot } = require('.');
const fixtures = require('../fixtures');

describe('Integration: unfurls', () => {
  test('issue', async () => {
    nock('https://api.github.com').get('/repos/bkeepers/dotenv').reply(200, fixtures.repo);

    nock('https://slack.com').post('/api/chat.unfurl', (body) => {
      // Test that the body posted to the unfurl matches the snapshot
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared)
      .expect(200);
  });

  test('only unfurls link first time a link is shared', async () => {
    // It should only make one request to this
    nock('https://api.github.com').get('/repos/bkeepers/dotenv').reply(200, fixtures.repo);

    // And it should only make one request to this
    nock('https://slack.com').post('/api/chat.unfurl', (body) => {
      // Test that the body posted to the unfurl matches the snapshot
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    // Perform the unfurl
    await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared)
      .expect(200);

    // Second unfurl does not make additional API requests
    await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared)
      .expect(200);
  });
});
