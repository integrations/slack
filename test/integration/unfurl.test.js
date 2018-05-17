const request = require('supertest');
const nock = require('nock');
const moment = require('moment');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const {
  SlackUser,
  GitHubUser,
  Unfurl,
  Subscription,
  Installation,
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
      nock('https://api.github.com').get('/repos/bkeepers/dotenv').times(2).reply(
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
      nock('https://api.github.com').get('/repos/bkeepers/dotenv').times(2).reply(
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
      nock('https://api.github.com').get('/repos/facebook/react').times(2).reply(200, fixtures.repo);
      nock('https://api.github.com').get('/repos/facebook/react/issues/10191').reply(200, fixtures.issue);
      nock('https://api.github.com').get('/repos/atom/atom').times(2).reply(200, fixtures.repo);
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

      const unfurls = await Unfurl.findAll();
      expect(unfurls.length).toBe(2);

      expect(unfurls[0].isCondensed).toBe(true);
      expect(unfurls[1].isCondensed).toBe(true);
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

      // Prompt to connect GitHub account
      nock('https://slack.com').post('/api/chat.postEphemeral').reply(200, { ok: true });

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

    test('Successful unfurl gets stored in db', async () => {
      nock('https://api.github.com').get('/repos/bkeepers/dotenv').times(2).reply(
        200,
        {
          ...fixtures.repo,
          updated_at: moment().subtract(2, 'months'),
        },
      );

      nock('https://slack.com').post('/api/chat.unfurl').reply(200, { ok: true });

      await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
        .expect(200);

      const unfurls = await Unfurl.findAll();
      expect(unfurls.length).toBe(1);
      const [unfurl] = unfurls;

      const { channel, message_ts, links } = fixtures.slack.link_shared().event;

      expect(unfurl.url).toBe(links[0].url);
      expect(unfurl.channelSlackId).toBe(channel);
      expect(unfurl.githubType).toBe('repo');
      expect(unfurl.isCondensed).toBe(false);
      expect(unfurl.slackMessageTimestamp).toBe(message_ts);
      expect(unfurl.isPublic).toBe(true);
      expect(unfurl.isDelivered).toBe(true);
      expect(unfurl.slackWorkspaceId).toBe(workspace.id);
    });

    test('Unsuccessful unfurl does not get stored in db', async () => {
      // Silence error logs for this test
      probot.logger.level('fatal');

      nock('https://api.github.com').get('/repos/bkeepers/dotenv').reply(404);

      // Prompt to connect GitHub account
      nock('https://slack.com').post('/api/chat.postEphemeral').reply(200, { ok: true });

      await request(probot.server).post('/slack/events')
        .send(fixtures.slack.link_shared())
        .expect(200);

      const unfurls = await Unfurl.findAll();
      expect(unfurls.length).toBe(0);
    });
  });

  describe('private unfurls', () => {
    let githubUser;
    let slackUser;
    beforeEach(async () => {
      githubUser = await GitHubUser.create({
        id: 1,
        accessToken: 'secret',
      });

      slackUser = await SlackUser.create({
        slackId: 'U88HS', // same as in link_shared.js
        slackWorkspaceId: workspace.id,
        githubId: githubUser.id,
      });
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
    test('clicking "Show rich preview" results in unfurl and deletes prompt', async () => {
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

      const unfurls = await Unfurl.findAll();
      expect(unfurls.length).toBe(1);

      const [unfurl] = unfurls;

      const { channel, message_ts, links } = fixtures.slack.link_shared().event;

      expect(unfurl.url).toBe(links[0].url);
      expect(unfurl.channelSlackId).toBe(channel);
      expect(unfurl.githubType).toBe(null);
      expect(unfurl.isCondensed).toBe(false);
      expect(unfurl.slackMessageTimestamp).toBe(message_ts);
      expect(unfurl.isPublic).toBe(false);
      expect(unfurl.isDelivered).toBe(false);
      expect(unfurl.slackWorkspaceId).toBe(workspace.id);


      nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
        200,
        {
          ...fixtures.repo,
          updated_at: moment().subtract(2, 'months'),
        },
      );

      nock('https://slack.com').post('/api/team.info').reply(200, { ok: true, team: { domain: 'acmecorp' } });
      nock('https://slack.com').post('/api/chat.unfurl', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      // User clicks 'Show rich preview'
      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify(fixtures.slack.action.unfurl(unfurlId)),
      })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });

      const [deliveredUnfurl] = await Unfurl.findAll();
      expect(deliveredUnfurl.githubType).toBe('repo');
      expect(deliveredUnfurl.isDelivered).toBe(true);
    });

    test('clicking "Dismiss" deletes the prompt and the unfurl record', async () => {
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

      let unfurls = await Unfurl.findAll();
      expect(unfurls.length).toBe(1);

      // User clicks 'Dismiss'
      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify({
          ...fixtures.slack.action.unfurl(unfurlId),
          actions: [
            {
              name: 'unfurl-dismiss',
              type: 'button',
              value: '',
            },
          ],
        }),
      })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });

      unfurls = await Unfurl.findAll();
      expect(unfurls.length).toBe(0);
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

    test('unfurls resources that cannot be private (such as organisations) without looking up repo privacy', async () => {
      // Get actual data to show in channel
      nock('https://api.github.com').get(`/users/kubernetes?access_token=${githubUser.accessToken}`).reply(
        200,
        {
          ...fixtures.org,
        },
      );

      nock('https://slack.com').post('/api/chat.unfurl', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
        event: {
          ...fixtures.slack.link_shared().event,
          links: [{
            url: 'https://github.com/kubernetes',
            domain: 'github.com',
          }],
        },
      }))
        .expect(200);
    });

    test('automatically unfurls private resources if they are part of subscribed repo', async () => {
      const installation = await Installation.create({
        githubId: 1,
        ownerId: 1337,
      });
      await Subscription.subscribe({
        creatorId: slackUser.id,
        slackWorkspaceId: workspace.id,
        githubId: 54321,
        channelId: 'C74M',
        installationId: installation.id,
      });
      nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
        200,
        {
          private: true,
          id: 54321,
        },
      );

      nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
        200,
        {
          ...fixtures.repo,
          updated_at: moment().subtract(2, 'months'),
        },
      );

      nock('https://slack.com').post('/api/chat.unfurl').reply(200, { ok: true });

      await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
        .expect(200);

      const [deliveredUnfurl] = await Unfurl.findAll();
      expect(deliveredUnfurl.isDelivered).toBe(true);
      expect(deliveredUnfurl.isPublic).toBe(false);
    });

    test('sending prompts works ', async () => {
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

      await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
        event: {
          ...fixtures.slack.link_shared().event,
          channel: 'C0Other',
        },
      }))
        .expect(200);
    });

    test('a user who does not have their GitHub account connected gets a message prompting to connect it', async () => {
      let prompt;
      nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
        prompt = body;
        return true;
      }).reply(200, { ok: true });

      await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
        event: {
          ...fixtures.slack.link_shared().event,
          user: 'U0Other',
        },
      }))
        .expect(200);

      const promptUrl = /^http:\/\/127\.0\.0\.1:\d+(\/github\/oauth\/login\?state=(.*))/;
      const attachments = JSON.parse(prompt.attachments);
      const { text, url } = attachments[0].actions[0];
      expect(text).toMatch('Connect GitHub account');
      expect(url).toMatch(promptUrl);

      // User follows link to OAuth
      const [, link, state] = url.match(promptUrl);

      const loginRequest = request(probot.server).get(link);
      await loginRequest.expect(302).expect(
        'Location',
        `https://github.com/login/oauth/authorize?client_id=&state=${state}`,
      );

      // GitHub authenticates user and redirects back
      nock('https://github.com').post('/login/oauth/access_token')
        .reply(200, fixtures.github.oauth);
      nock('https://api.github.com').get('/user')
        .reply(200, fixtures.user);

      nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      await request(probot.server).get('/github/oauth/callback').query({ state })
        .expect(302)
        .expect(
          'Location',
          `https://slack.com/app_redirect?team=${fixtures.slack.link_shared().team_id}&channel=${fixtures.slack.link_shared().event.channel}`,
        );
    });

    describe('for users who do not yet have their GitHub account connected', async () => {
      beforeEach(async () => {
        const { SlackWorkspace } = models;
        await SlackWorkspace.create({
          slackId: 'T0Other',
          accessToken: 'xoxa-token',
        });
      });
      test('public unfurls work as normal', async () => {
        process.env.GITHUB_TOKEN = 'super-secret';
        nock('https://api.github.com').get('/repos/bkeepers/dotenv').times(2).reply(
          200,
          {
            ...fixtures.repo,
            updated_at: moment().subtract(2, 'months'),
          },
        );

        nock('https://slack.com').post('/api/chat.unfurl').reply(200, { ok: true });

        await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
          ...fixtures.slack.link_shared(),
          team_id: 'T0Other',
          event: {
            ...fixtures.slack.link_shared().event,
            channel: 'C0Other',
          },
        }))
          .expect(200);
      });
      test('private unfurls show prompt to connect GitHub account', async () => {
        nock('https://api.github.com').get('/repos/bkeepers/dotenv').reply(404);

        let prompt;
        nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
          prompt = body;
          return true;
        }).reply(200, { ok: true });


        await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
          ...fixtures.slack.link_shared(),
          team_id: 'T0Other',
          event: {
            ...fixtures.slack.link_shared().event,
            channel: 'C0Other',
          },
        }))
          .expect(200);

        const promptUrl = /^http:\/\/127\.0\.0\.1:\d+(\/github\/oauth\/login\?state=(.*))/;
        const attachments = JSON.parse(prompt.attachments);
        const { text, url } = attachments[0].actions[0];
        expect(text).toMatch('Connect GitHub account');
        expect(url).toMatch(promptUrl);
      });
    });

    describe('settings', async () => {
      let unfurlId;
      beforeEach(async () => {
        nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
          200,
          {
            private: true,
            id: 12345,
          },
        );

        nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
          const pattern = /"callback_id":"unfurl-(\d+)"/;
          const match = pattern.exec(body.attachments);
          [, unfurlId] = match;
          return true;
        }).reply(200, { ok: true });

        // Link is shared in channel
        await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
          .expect(200);
      });

      describe('User clicks "Show rich preview" and gets AutoUnfurlPrompt', async () => {
        beforeEach(async () => {
          nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
            200,
            {
              ...fixtures.repo,
              updated_at: moment().subtract(2, 'months'),
            },
          );

          nock('https://slack.com').post('/api/team.info').reply(200, { ok: true, team: { domain: 'acmecorp' } });
          nock('https://slack.com').post('/api/chat.unfurl').reply(200, { ok: true });
          // User clicks 'Show rich preview'
          await request(probot.server).post('/slack/actions').send({
            payload: JSON.stringify(fixtures.slack.action.unfurl(unfurlId)),
          })
            .expect(200);
        });


        test('when user clicks "Enable for all channels", they get a confirmation message', async () => {
          await request(probot.server).post('/slack/actions').send({
            payload: JSON.stringify(fixtures.slack.action.unfurlAuto('bkeepers', 'dotenv', 12345, 'all-channels')),
          })
            .expect(200)
            .expect((res) => {
              expect(res.body).toMatchSnapshot();
            });
        });

        describe('User clicks "Enable for all channels"', async () => {
          beforeEach(async () => {
            await request(probot.server).post('/slack/actions').send({
              payload: JSON.stringify(fixtures.slack.action.unfurlAuto('bkeepers', 'dotenv', 12345, 'all-channels')),
            })
              .expect(200);
          });
          test('setting is saved in the database', async () => {
            // User clicks 'Enable for all channels'
            await slackUser.reload();
            expect(slackUser.settings.unfurlPrivateResources['12345']).toContain('all');
          });

          test('subsequent link (to the same repo) shared in a different channel is automatically unfurled', async () => {
            nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
              200,
              {
                private: true,
                id: 12345,
              },
            );

            nock('https://api.github.com')
              .get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`)
              .reply(200, fixtures.repo);

            nock('https://slack.com').post('/api/chat.unfurl').reply(200, { ok: true });

            // Link shared in other channel
            await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
              event: {
                ...fixtures.slack.link_shared().event,
                channel: 'C0Other',
              },
            }))
              .expect(200);
          });

          test('subsequent link shared to a different repo results in a new prompt', async () => {
            nock('https://api.github.com').get(`/repos/integrations/test?access_token=${githubUser.accessToken}`).reply(
              200,
              {
                private: true,
                id: 54321,
              },
            );


            nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
              expect({
                ...body,
                attachments: body.attachments.replace(/"callback_id":"unfurl-\d+"/, '"callback_id":"unfurl-123"'),
              }).toMatchSnapshot();
              return true;
            }).reply(200, { ok: true });

            // Link shared in other channel
            await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
              event: {
                ...fixtures.slack.link_shared().event,
                links: [{
                  url: 'https://github.com/integrations/test',
                  domain: 'github.com',
                }],
              },
            }))
              .expect(200);
          });
        });


        test('when user clicks "Enable for this channel", they get a confirmation message', async () => {
          await request(probot.server).post('/slack/actions').send({
            payload: JSON.stringify(fixtures.slack.action.unfurlAuto('bkeepers', 'dotenv', 12345, 'this-channel')),
          })
            .expect(200)
            .expect((res) => {
              expect(res.body).toMatchSnapshot();
            });
        });

        describe('User clicks "Enable for this channel"', async () => {
          beforeEach(async () => {
            await request(probot.server).post('/slack/actions').send({
              payload: JSON.stringify(fixtures.slack.action.unfurlAuto('bkeepers', 'dotenv', 12345, 'this-channel')),
            })
              .expect(200);
          });
          test('setting is saved in the database', async () => {
            // User clicks 'Enable for all channels'
            await slackUser.reload();
            expect(slackUser.settings.unfurlPrivateResources['12345']).toContain('C74M');
          });

          test('subsequent link (to the same repo) shared in the same channel is automatically unfurled', async () => {
            nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).times(2).reply(
              200,
              {
                private: true,
                id: 12345,
              },
            );

            nock('https://api.github.com')
              .get(`/repos/bkeepers/dotenv/issues/1?access_token=${githubUser.accessToken}`)
              .reply(200, fixtures.issue);

            nock('https://slack.com').post('/api/chat.unfurl').reply(200, { ok: true });

            // Link to issue due to 30min unfurl un-elligibility
            await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
              event: {
                ...fixtures.slack.link_shared().event,
                links: [{
                  url: 'https://github.com/bkeepers/dotenv/issues/1',
                  domain: 'github.com',
                }],
              },
            }))
              .expect(200);
          });

          test('subsequent link shared in a different channel results in a new prompt', async () => {
            nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
              200,
              {
                private: true,
                id: 54321,
              },
            );

            nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
              expect({
                ...body,
                attachments: body.attachments.replace(/"callback_id":"unfurl-\d+"/, '"callback_id":"unfurl-123"'),
              }).toMatchSnapshot();
              return true;
            }).reply(200, { ok: true });

            // Link shared in other channel
            await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
              event: {
                ...fixtures.slack.link_shared().event,
                channel: 'C0Other',
              },
            }))
              .expect(200);
          });

          test('subsequent link shared in the same channel to a different repo results in a new prompt', async () => {
            nock('https://api.github.com').get(`/repos/integrations/test?access_token=${githubUser.accessToken}`).reply(
              200,
              {
                private: true,
                id: 54321,
              },
            );

            nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
              expect({
                ...body,
                attachments: body.attachments.replace(/"callback_id":"unfurl-\d+"/, '"callback_id":"unfurl-123"'),
              }).toMatchSnapshot();
              return true;
            }).reply(200, { ok: true });

            // Link shared in other channel
            await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared({
              event: {
                ...fixtures.slack.link_shared().event,
                links: [{
                  url: 'https://github.com/integrations/test',
                  domain: 'github.com',
                }],
              },
            }))
              .expect(200);
          });

          test('User can enable auto unfurls for the same repo in a different channel', async () => {
            await request(probot.server).post('/slack/actions').send({
              payload: JSON.stringify({
                ...fixtures.slack.action.unfurlAuto('bkeepers', 'dotenv', 12345, 'this-channel'),
                channel: {
                  id: 'C0Other',
                  name: 'other-channel',
                },
              }),
            })
              .expect(200);

            await slackUser.reload();
            expect(slackUser.settings.unfurlPrivateResources['12345']).toContain('C0Other');
          });
        });
      });


      test('when user clicks "dismiss", no follow up prompt is immediately shown', async () => {
        // User clicks 'Dismiss'
        await request(probot.server).post('/slack/actions').send({
          payload: JSON.stringify(fixtures.slack.action.unfurlDismiss(unfurlId)),
        })
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
      });

      test('when user clicks "dismiss" 5 times, the MutePromptsPrompt is shown', async () => {
        nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).times(5).reply(
          200,
          {
            private: true,
            id: 12345,
          },
        );
        nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
          const pattern = /"callback_id":"unfurl-(\d+)"/;
          const match = pattern.exec(body.attachments);
          [, unfurlId] = match;
          return true;
        }).times(5).reply(200, { ok: true });

        // User clicks 'Dismiss' 5 times
        // 1
        await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared()).expect(200);
        await request(probot.server).post('/slack/actions').send({
          payload: JSON.stringify(fixtures.slack.action.unfurlDismiss(unfurlId)),
        })
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });

        // 2
        await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared()).expect(200);
        await request(probot.server).post('/slack/actions').send({
          payload: JSON.stringify(fixtures.slack.action.unfurlDismiss(unfurlId)),
        })
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });

        // 3
        await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared()).expect(200);
        await request(probot.server).post('/slack/actions').send({
          payload: JSON.stringify(fixtures.slack.action.unfurlDismiss(unfurlId)),
        })
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });

        // 4
        await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared()).expect(200);
        await request(probot.server).post('/slack/actions').send({
          payload: JSON.stringify(fixtures.slack.action.unfurlDismiss(unfurlId)),
        })
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });

        // 5
        await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared()).expect(200);
        await request(probot.server).post('/slack/actions').send({
          payload: JSON.stringify(fixtures.slack.action.unfurlDismiss(unfurlId)),
        })
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
      });

      describe('User clicks "Dismiss" and gets MutePromptsPrompt', async () => {
        beforeEach(async () => {
          await request(probot.server).post('/slack/actions').send({
            payload: JSON.stringify(fixtures.slack.action.unfurlDismiss(unfurlId)),
          })
            .expect(200);
        });

        test('When user clicks "Mute prompts for 24h", they get a confirmation message', async () => {
          await request(probot.server).post('/slack/actions').send({
            payload: JSON.stringify(fixtures.slack.action.unfurlMutePrompts('mute-24h')),
          })
            .expect(200)
            .expect((res) => {
              expect(res.body).toMatchSnapshot();
            });
        });

        describe('User clicks "Mute prompts for 24h"', async () => {
          beforeEach(async () => {
            Date.now = jest.fn(() => new Date(Date.UTC(2018, 4, 18)).valueOf());
            await request(probot.server).post('/slack/actions').send({
              payload: JSON.stringify(fixtures.slack.action.unfurlMutePrompts('mute-24h')),
            })
              .expect(200);
          });
          test('setting is saved in the database', async () => {
            await slackUser.reload();
            expect(slackUser.settings.muteUnfurlPromptsUntil).toBe(1526688000);
          });

          test('A link shared within 24h does not cause a prompt', async () => {
            Date.now = jest.fn(() => new Date(Date.UTC(2018, 4, 18)).valueOf() + 100);

            nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
              200,
              {
                private: true,
                id: 12345,
              },
            );

            // Link is shared in channel
            await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
              .expect(200);
          });

          test('A link shared after 24h does cause a prompt', async () => {
            Date.now = jest.fn(() => new Date(Date.UTC(2018, 4, 20)).valueOf());

            nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
              200,
              {
                private: true,
                id: 12345,
              },
            );

            nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
              const pattern = /"callback_id":"unfurl-(\d+)"/;
              const match = pattern.exec(body.attachments);
              [, unfurlId] = match;
              return true;
            }).reply(200, { ok: true });

            // Link is shared in channel
            await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
              .expect(200);
          });
        });

        test('When user clicks "Mute prompts indefinitely", they get a confirmation message', async () => {
          await request(probot.server).post('/slack/actions').send({
            payload: JSON.stringify(fixtures.slack.action.unfurlMutePrompts('mute-indefinitely')),
          })
            .expect(200)
            .expect((res) => {
              expect(res.body).toMatchSnapshot();
            });
        });

        describe('User clicks "Mute prompts indefinitely"', async () => {
          beforeEach(async () => {
            await request(probot.server).post('/slack/actions').send({
              payload: JSON.stringify(fixtures.slack.action.unfurlMutePrompts('mute-indefinitely')),
            })
              .expect(200);
          });

          test('setting is saved in the database', async () => {
            await slackUser.reload();
            expect(slackUser.settings.muteUnfurlPromptsIndefinitely).toBe(true);
          });

          test('A shared link does not cause a prompt', async () => {
            nock('https://api.github.com').get(`/repos/bkeepers/dotenv?access_token=${githubUser.accessToken}`).reply(
              200,
              {
                private: true,
                id: 12345,
              },
            );

            // Link is shared in channel
            await request(probot.server).post('/slack/events').send(fixtures.slack.link_shared())
              .expect(200);
          });
        });
      });
    });
  });
});
