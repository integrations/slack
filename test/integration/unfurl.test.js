

const request = require('supertest');
const nock = require('nock');
const moment = require('moment');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const {
  SlackUser,
  GitHubUser,
} = models;

describe('Integration: unfurls', () => {
  let workspace;
  beforeEach(async () => {
    const { SlackWorkspace } = models;
    workspace = await SlackWorkspace.create({
      slackId: 'T000A',
      accessToken: 'xoxa-token',
    });
  });

  describe('public unfurls', () => {
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
        expect(unfurls[Object.keys(unfurls)[0]].text).toBe(undefined);
        return true;
      }).times(2).reply(200, { ok: true });

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

  describe('private unfurls', () => {
    let githubUser;
    beforeEach(async () => {
      process.env.ALLOWED_CHANNELS = 'C74M'; // same as in link_shared.js
      githubUser = await GitHubUser.create({
        id: 1,
        accessToken: 'secret',
      });

      await SlackUser.create({
        slackId: 'U88HS', // same as in link_shared.js
        slackWorkspaceId: workspace.id,
        githubId: githubUser.id,
      });
    });

    afterEach(() => {
      process.env.ALLOWED_CHANNELS = '';
    });
    test('sends prompt for private resource that can be unfurled', async () => {
      nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
        200,
        {
          private: true,
        },
      );

      nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
        expect({
          ...body,
          attachments: body.attachments.replace(/"callback_id":"unfurl-\d+"/, '"callback_id":"unfurl-123"'),
        }).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
        .expect(200);
    });
    test('clicking "Show rich preview" results in unfurl', async () => {
      nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
        200,
        {
          private: true,
        },
      );

      let unfurlId;
      nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
        const pattern = /"callback_id":"unfurl-(\d+)"/;
        const match = pattern.exec(body.attachments);
        [, unfurlId] = match;
        return true;
      }).reply(200, { ok: true });

      // Link is shared in channel
      await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
        .expect(200);


      nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
        200,
        {
          ...fixtures.repo,
          updated_at: moment().subtract(2, 'months'),
        },
      );

      nock('https://slack.com').post('/api/chat.unfurl', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      // User clicks 'Show rich preview'
      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify(fixtures.slack.action.unfurl(unfurlId)),
      })
        .expect(200);
    });
    test('throws error when user is not linked', async () => {
      await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
        event: {
          ...fixtures.slack.link_shared().event,
          user: 'U0Other',
        },
      }))
        .expect(500);
    });
    test('no prompt is shown for unsupported resources', async () => {
      await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
        event: {
          ...fixtures.slack.link_shared().event,
          links: [{
            url: 'https://github.com/bkeepers/dotenv/some/random/thing',
            domain: 'github.com',
          }],
        },
      }))
        .expect(200);
    });
    test('no prompt is shown when repo returns 404', async () => {
      nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`)
        .reply(404);
      await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
        .expect(200);
    });
    test('no prompt is shown when repo exists but resource does not', async () => {
      nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`)
        .reply(200);

      nock('https://api.github.com').get(`/repos/bkeepers/dotenv/issues/4000?access_token=${githubUser.accessToken}`)
        .reply(404);

      await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
        event: {
          ...fixtures.slack.link_shared().event,
          links: [{
            url: 'https://github.com/bkeepers/dotenv/issues/4000',
            domain: 'github.com',
          }],
        },
      }))
        .expect(200);
    });
    test('uses user access token for public resources', async () => {
      // Check to see if repo is private or public
      nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`)
        .reply(200);

      // Get actual data to show in channel
      nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
        200,
        {
          ...fixtures.repo,
          updated_at: moment().subtract(2, 'months'),
        },
      );

      nock('https://slack.com').post('/api/chat.unfurl', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
        .expect(200);
    });

    describe('in channels wich are not in ALLOWED_CHANNELS', async () => {
      test('public unfurls work as normal', async () => {
        process.env.GITHUB_TOKEN = 'super-secret';
        nock('https://api.github.com').get('/repos/bkeepers/dotenv').reply(
          200,
          {
            ...fixtures.repo,
            updated_at: moment().subtract(2, 'months'),
          },
        );

        nock('https://slack.com').post('/api/chat.unfurl').reply(200, { ok: true });

        await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
          event: {
            ...fixtures.slack.link_shared().event,
            channel: 'C0Other',
          },
        }))
          .expect(200);
      });
      test('private unfurls don\'t show prompt', async () => {
        nock('https://api.github.com').get('/repos/bkeepers/dotenv').reply(404);

        await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
          event: {
            ...fixtures.slack.link_shared().event,
            channel: 'C0Other',
          },
        }))
          .expect(200);
      });
    });
  });
});
