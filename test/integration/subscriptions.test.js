const request = require('supertest');
const nock = require('nock');

const helper = require('.');
const fixtures = require('../fixtures');
const configMigrationEvent = require('../fixtures/slack/config_migration.json');

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
      const promptUrl = /^http:\/\/127\.0\.0\.1:\d+(\/github\/oauth\/login\?state=(.*))/;
      const { text } = res.body.attachments[0].actions[0];
      const { url } = res.body.attachments[0].actions[0];
      expect(text).toMatch('Connect GitHub account');
      expect(url).toMatch(promptUrl);
    });
  });

  describe('authenticated user', () => {
    let slackWorkspace;
    beforeEach(async () => {
      const { SlackWorkspace, SlackUser, GitHubUser } = helper.robot.models;

      // create user
      const user = await GitHubUser.create({
        id: 2,
        accessToken: 'github-token',
      });
      slackWorkspace = await SlackWorkspace.create({
        slackId: 'T0001',
        accessToken: 'xoxp-token',
      });
      await SlackUser.create({
        slackId: 'U2147483697',
        slackWorkspaceId: slackWorkspace.id,
        githubId: user.id,
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
      let installation;
      beforeEach(async () => {
        const { Installation } = helper.robot.models;
        // Create an installation
        installation = await Installation.create({
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

      test('unsubscribing from a specific type of notification', async () => {
        const { Installation } = helper.robot.models;

        // Create an installation
        installation = await Installation.create({
          githubId: 1,
          ownerId: fixtures.repo.owner.id,
        });

        nock('https://api.github.com').get('/orgs/bkeepers').times(3).reply(200, fixtures.repo.owner);
        nock('https://api.github.com').get('/repos/bkeepers/dotenv').times(3).reply(200, fixtures.repo);
        nock('https://api.github.com').get('/repos/bkeepers/dotenv/pulls?per_page=1').times(2).reply(200, {});

        await request(probot.server).post('/slack/command')
          .send(fixtures.slack.command({
            text: 'subscribe bkeepers/dotenv',
          }))
          .expect(200)
          .expect((res) => {
            expect(JSON.stringify(res.body)).toMatch(/subscribed/i);
            expect(res.body).toMatchSnapshot();
          });

        const { Subscription } = helper.robot.models;
        const [subscription] = await Subscription.lookup(fixtures.repo.id);

        expect(subscription.isEnabledForGitHubEvent('issues')).toBe(true);

        await request(probot.server).post('/slack/command')
          .send(fixtures.slack.command({
            text: 'unsubscribe bkeepers/dotenv issues',
          }))
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });

        await subscription.reload();
        expect(subscription.isEnabledForGitHubEvent('issues')).toBe(false);

        await request(probot.server).post('/slack/command')
          .send(fixtures.slack.command({
            text: 'subscribe bkeepers/dotenv issues',
          }))
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });

        await subscription.reload();
        expect(subscription.isEnabledForGitHubEvent('issues')).toBe(true);
      });

      test('subscribing when already subscribed', async () => {
        nock('https://api.github.com').get('/orgs/atom').reply(200, fixtures.org);
        nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.repo);
        nock('https://api.github.com').get('/repos/atom/atom/pulls?per_page=1').reply(200, {});

        const { Subscription } = helper.robot.models;
        await Subscription.create({
          githubId: fixtures.repo.id,
          channelId: 'C2147483705',
          slackWorkspaceId: slackWorkspace.id,
          installationId: installation.id,
        });
        const command = fixtures.slack.command({ text: 'subscribe atom/atom' });

        await request(probot.server).post('/slack/command').send(command)
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
      });

      test('unsubscribing when not subscribed', async () => {
        nock('https://api.github.com').get('/orgs/atom').reply(200, fixtures.org);
        nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.repo);

        const command = fixtures.slack.command({ text: 'unsubscribe atom/atom' });

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

      test('unsubscribing with a bad url', async () => {
        const command = fixtures.slack.command({
          text: 'unsubscribe wat?',
        });

        const req = request(probot.server).post('/slack/command').send(command);

        await req.expect(200).expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
      });

      test('subscribing to a repo that does not exist', async () => {
        nock('https://api.github.com').get('/orgs/atom').reply(200, fixtures.org);
        nock('https://api.github.com').get('/repos/atom/atom').reply(404, {});
        const command = fixtures.slack.command({
          text: 'subscribe atom/atom',
        });

        const req = request(probot.server).post('/slack/command').send(command);

        await req.expect(200).expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
      });

      test('subscribing to a repo that the used does not have acccess to', async () => {
        nock('https://api.github.com').get('/orgs/atom').reply(200, fixtures.org);
        nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.repo);
        nock('https://api.github.com').get('/repos/atom/atom/pulls?per_page=1').reply(404, {});
        const command = fixtures.slack.command({
          text: 'subscribe atom/atom',
        });

        const req = request(probot.server).post('/slack/command').send(command);

        await req.expect(200).expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
      });
      describe('Legacy subscriptions:', () => {
        beforeEach(async () => {
          nock('https://slack.com').post('/api/chat.postMessage').times(5).reply(200, { ok: true });
          await request(probot.server)
            .post('/slack/events')
            .send(configMigrationEvent)
            .expect(200);
        });
        test('subscribing to a repo whose legacy configuration is not already reactivated is disabled', async () => {
          nock('https://api.github.com').get('/orgs/atom').reply(200, fixtures.org);
          nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.atomRepo);
          nock('https://api.github.com').get('/repos/atom/atom/pulls?per_page=1').reply(200, {});

          nock('https://slack.com').post('/api/services.update', (body) => {
            expect(body).toMatchSnapshot();
            return true;
          }).reply(200, { ok: true });

          const command = fixtures.slack.command({
            text: 'subscribe atom/atom',
            channel_id: 'C0D70MRAL',
            team_id: 'T0001',
          });

          await request(probot.server).post('/slack/command').send(command)
            .expect(200)
            .expect((res) => {
              expect(res.body).toMatchSnapshot();
            });
        });

        test('subscribing to a repo that\'s already reactivated works as normal', async () => {
          nock('https://api.github.com').get('/orgs/atom').times(3).reply(200, fixtures.org);
          nock('https://api.github.com').get('/repos/atom/atom').times(3).reply(200, fixtures.atomRepo);
          nock('https://api.github.com').get('/repos/atom/atom/pulls?per_page=1').times(2).reply(200, {});

          nock('https://slack.com').post('/api/services.update').reply(200, { ok: true });

          const command = fixtures.slack.command({
            text: 'subscribe atom/atom',
            channel_id: 'C0D70MRAL',
          });

          await request(probot.server).post('/slack/command').send(command)
            .expect(200)
            .expect((res) => {
              expect(res.body).toMatchSnapshot();
            });

          const unsubscribeCommand = fixtures.slack.command({
            text: 'unsubscribe atom/atom',
            channel_id: 'C0D70MRAL',
          });

          await request(probot.server).post('/slack/command').send(unsubscribeCommand)
            .expect(200)
            .expect((res) => {
              expect(res.body).toMatchSnapshot();
            });

          // This does not result in a second call to services.update
          await request(probot.server).post('/slack/command').send(command)
            .expect(200)
            .expect((res) => {
              expect(res.body).toMatchSnapshot();
            });
        });
      });
    });
  });
});
