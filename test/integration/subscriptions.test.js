const supertest = require('supertest');
const nock = require('nock');

const { probot, slackbot, models } = require('.');
const fixtures = require('../fixtures');
const configMigrationEvent = require('../fixtures/slack/config_migration.json');

describe('Integration: subscriptions', () => {
  let request;

  beforeEach(() => {
    request = supertest.agent(probot.server);
  });

  describe('unauthenticated user', () => {
    test('is prompted to authenticate before subscribing', async () => {
      // User types slash command
      const command = fixtures.slack.command({
        text: 'subscribe https://github.com/kubernetes/kubernetes',
      });
      const req = request.post('/slack/command').use(slackbot).send(command);
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
    let user;
    beforeEach(async () => {
      const { SlackWorkspace, SlackUser, GitHubUser } = models;

      // create user
      user = await GitHubUser.create({
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
      function stripUrl(message) {
        const new_message = { ...message };
        new_message.attachments[0].actions[0].url = 'url-is-stripped';
        return new_message;
      }
      test('prompts to install app', async () => {
        nock('https://api.github.com').get('/repos/atom/atom/installation').reply(404);
        nock('https://api.github.com').get('/users/atom').reply(200, fixtures.org);

        const command = fixtures.slack.command({
          text: 'subscribe atom/atom',
        });

        const res = await request.post('/slack/command').use(slackbot).send(command)
          .expect(200);

        const action = res.body.attachments[0].actions[0];
        expect(action.text).toEqual('Install GitHub App');
        expect(action.url).toMatch(new RegExp(`/github/install/${fixtures.org.id}`));
      });

      test('organization is not found', async () => {
        nock('https://api.github.com').get('/repos/atom/atom/installation').reply(404);
        nock('https://api.github.com').get('/users/atom').reply(404);

        const command = fixtures.slack.command({
          text: 'subscribe atom/atom',
        });

        await request.post('/slack/command').use(slackbot).send(command)
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
      });

      test('user is repo owner', async () => {
        nock('https://api.github.com').get('/repos/bkeepers/dotenv/installation').reply(404);
        nock('https://api.github.com').get('/users/bkeepers').reply(200, {
          type: 'User',
          id: parseInt(user.id, 10),
        });

        const command = fixtures.slack.command({
          text: 'subscribe bkeepers/dotenv',
        });

        await request.post('/slack/command').use(slackbot).send(command)
          .expect(200)
          .expect((res) => {
            expect(stripUrl(res.body)).toMatchSnapshot();
          });
      });

      test('owner type is other user', async () => {
        nock('https://api.github.com').get('/repos/wilhelmklopp/wilhelmklopp/installation').reply(404);
        nock('https://api.github.com').get('/users/wilhelmklopp').reply(200, {
          type: 'User',
          id: 7718702,
        });

        const command = fixtures.slack.command({
          text: 'subscribe wilhelmklopp/wilhelmklopp',
        });
        const pattern = /^Either the app isn't installed on your repository or the repository does not exist\. Install it to proceed\.\n_Note: You will need to ask the owner of the repository to install it for you\. Give them <(.*)\|this link\.>_/;

        await request.post('/slack/command').use(slackbot).send(command)
          .expect(200)
          .expect((res) => {
            expect(res.body.attachments[0].text).toMatch(pattern);
          });
      });

      test('owner type is organization', async () => {
        nock('https://api.github.com').get('/repos/atom/atom/installation').reply(404);
        nock('https://api.github.com').get('/users/atom').reply(200, {
          type: 'organization',
          id: 1089146,
        });

        const command = fixtures.slack.command({
          text: 'subscribe atom/atom',
        });

        await request.post('/slack/command').use(slackbot).send(command)
          .expect(200)
          .expect((res) => {
            expect(stripUrl(res.body)).toMatchSnapshot();
          });
      });
    });

    describe('with GitHub App installed', () => {
      let installation;
      beforeEach(async () => {
        const { Installation } = models;
        // Create an installation
        installation = await Installation.create({
          githubId: 1,
          ownerId: fixtures.org.id,
        });
      });

      test('successfully subscribing and unsubscribing to a repository', async () => {
        nock('https://api.github.com').get('/repos/kubernetes/kubernetes/installation').times(2).reply(200, {
          id: installation.githubId,
          account: fixtures.repo.owner,
        });
        nock('https://api.github.com').get('/repos/kubernetes/kubernetes').times(2).reply(200, fixtures.repo);

        const command = fixtures.slack.command({
          text: 'subscribe https://github.com/kubernetes/kubernetes',
        });

        await request.post('/slack/command').use(slackbot).send(command)
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });

        const unsubscribeCommand = fixtures.slack.command({
          text: 'unsubscribe https://github.com/kubernetes/kubernetes',
        });

        await request.post('/slack/command').use(slackbot).send(unsubscribeCommand)
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
      });

      test('successfully subscribing with repository shorthand', async () => {
        nock('https://api.github.com').get('/repos/atom/atom/installation').reply(200, {
          id: installation.githubId,
          account: fixtures.repo.owner,
        });
        nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.repo);

        const command = fixtures.slack.command({ text: 'subscribe atom/atom' });

        await request.post('/slack/command').use(slackbot).send(command)
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
      });

      test('unsubscribing from a specific type of notification', async () => {
        const { Installation } = models;

        // Create an installation
        installation = await Installation.create({
          githubId: 1,
          ownerId: fixtures.repo.owner.id,
        });

        nock('https://api.github.com').get('/repos/bkeepers/dotenv/installation').times(3).reply(200, {
          id: installation.githubId,
          account: fixtures.repo.owner,
        });
        nock('https://api.github.com').get('/repos/bkeepers/dotenv').times(3).reply(200, fixtures.repo);

        await request.post('/slack/command').use(slackbot)
          .send(fixtures.slack.command({
            text: 'subscribe bkeepers/dotenv',
          }))
          .expect(200)
          .expect((res) => {
            expect(JSON.stringify(res.body)).toMatch(/subscribed/i);
            expect(res.body).toMatchSnapshot();
          });

        const { Subscription } = models;
        const [subscription] = await Subscription.lookup(fixtures.repo.id);

        expect(subscription.isEnabledForGitHubEvent('issues')).toBe(true);

        await request.post('/slack/command')
          .use(slackbot)
          .send(fixtures.slack.command({
            text: 'unsubscribe bkeepers/dotenv pulls issues',
          }))
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });

        await subscription.reload();
        expect(subscription.isEnabledForGitHubEvent('pulls')).toBe(false);
        expect(subscription.isEnabledForGitHubEvent('issues')).toBe(false);

        await request.post('/slack/command').use(slackbot)
          .send(fixtures.slack.command({
            text: 'subscribe bkeepers/dotenv pulls issues',
          }))
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });

        await subscription.reload();
        expect(subscription.isEnabledForGitHubEvent('pulls')).toBe(true);
        expect(subscription.isEnabledForGitHubEvent('issues')).toBe(true);
      });

      test('subscribing when already subscribed', async () => {
        nock('https://api.github.com').get('/repos/atom/atom/installation').reply(200, {
          id: installation.githubId,
          account: fixtures.repo.owner,
        });
        nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.repo);

        const { Subscription } = models;
        await Subscription.create({
          githubId: fixtures.repo.id,
          channelId: 'C2147483705',
          slackWorkspaceId: slackWorkspace.id,
          installationId: installation.id,
        });
        const command = fixtures.slack.command({ text: 'subscribe atom/atom' });

        await request.post('/slack/command').use(slackbot).send(command)
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
      });

      test('unsubscribing when not subscribed', async () => {
        nock('https://api.github.com').get('/repos/atom/atom/installation').reply(200, {
          id: installation.githubId,
          account: fixtures.repo.owner,
        });
        nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.repo);

        const command = fixtures.slack.command({ text: 'unsubscribe atom/atom' });

        await request.post('/slack/command').use(slackbot).send(command)
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
      });


      test('subscribing with a bad url', async () => {
        const command = fixtures.slack.command({
          text: 'subscribe wat?',
        });

        const req = request.post('/slack/command').use(slackbot).send(command);

        await req.expect(200).expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
      });

      test('unsubscribing with a bad url', async () => {
        const command = fixtures.slack.command({
          text: 'unsubscribe wat?',
        });

        const req = request.post('/slack/command').use(slackbot).send(command);

        await req.expect(200).expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
      });

      test('subscribing to a repo that does not exist', async () => {
        nock('https://api.github.com').get('/repos/atom/atom/installation').reply(404);
        nock('https://api.github.com').get('/users/atom').reply(404);

        const command = fixtures.slack.command({
          text: 'subscribe atom/atom',
        });

        const req = request.post('/slack/command').use(slackbot).send(command);

        await req.expect(200).expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
      });

      test('subscribing to a repo that the user does not have acccess to', async () => {
        nock('https://api.github.com').get('/repos/atom/atom/installation').reply(200, {
          id: installation.githubId,
          account: fixtures.repo.owner,
        });
        nock('https://api.github.com').get('/repos/atom/atom').reply(404);

        const command = fixtures.slack.command({
          text: 'subscribe atom/atom',
        });

        const req = request.post('/slack/command').use(slackbot).send(command);

        await req.expect(200).expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
      });
      describe('Legacy subscriptions:', () => {
        const { Subscription } = models;
        beforeEach(async () => {
          nock('https://slack.com').post('/api/chat.postMessage').times(4).reply(200, { ok: true });
          await request
            .post('/slack/events')
            .send(configMigrationEvent)
            .expect(200);
        });
        test('subscribing to a repo whose legacy configuration is not already reactivated is disabled', async () => {
          nock('https://api.github.com').get('/repos/atom/atom/installation').reply(200, {
            id: installation.githubId,
            account: fixtures.atomRepo.owner,
          });
          nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.atomRepo);

          nock('https://slack.com').post('/api/services.update', (body) => {
            expect(body).toMatchSnapshot();
            return true;
          }).reply(200, { ok: true });

          const command = fixtures.slack.command({
            text: 'subscribe atom/atom',
            channel_id: 'C0D70MRAL',
            team_id: 'T0001',
          });

          await request.post('/slack/command').use(slackbot).send(command)
            .expect(200)
            .expect((res) => {
              expect(res.body).toMatchSnapshot();
            });
        });

        test('retains old configuration', async () => {
          nock('https://api.github.com').get('/repos/atom/atom/installation').reply(200, {
            id: installation.githubId,
            account: fixtures.atomRepo.owner,
          });
          nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.atomRepo);

          nock('https://slack.com').post('/api/services.update').reply(200, { ok: true });

          const command = fixtures.slack.command({
            text: 'subscribe atom/atom',
            channel_id: 'C0D70MRAL',
            team_id: 'T0001',
          });

          await request.post('/slack/command').use(slackbot).send(command)
            .expect(200);

          const subscription = await Subscription.findOne({
            where: {
              slackWorkspaceId: slackWorkspace.id,
              channelId: 'C0D70MRAL',
              githubId: fixtures.atomRepo.id,
            },
          });
          expect(subscription.settings).toEqual({
            branches: true,
            comments: true,
            commits: false,
            deployments: false,
            issues: true,
            pulls: true,
            reviews: true,
          });
        });

        test('retains old configuration spread across multiple configurations', async () => {
          nock('https://api.github.com').get('/repos/kubernetes/kubernetes/installation').reply(200, {
            id: installation.githubId,
            account: fixtures.kubernetesRepo.owner,
          });
          nock('https://api.github.com').get('/repos/kubernetes/kubernetes').reply(200, fixtures.kubernetesRepo);

          nock('https://slack.com').post('/api/services.update').times(2).reply(200, { ok: true });

          const command = fixtures.slack.command({
            text: 'subscribe kubernetes/kubernetes',
            channel_id: 'C0D70MRAL',
            team_id: 'T0001',
          });

          await request.post('/slack/command').use(slackbot).send(command)
            .expect(200);

          const subscription = await Subscription.findOne({
            where: {
              slackWorkspaceId: slackWorkspace.id,
              channelId: 'C0D70MRAL',
              githubId: fixtures.kubernetesRepo.id,
            },
          });
          expect(subscription.settings).toEqual({
            branches: true,
            comments: true,
            commits: 'all',
            deployments: false,
            issues: true,
            pulls: true,
            reviews: true,
          });
        });

        test('subscribing to a repo that\'s already reactivated works as normal', async () => {
          nock('https://api.github.com').get('/repos/atom/atom/installation').times(3).reply(200, {
            id: installation.githubId,
            account: fixtures.atomRepo.owner,
          });
          nock('https://api.github.com').get('/repos/atom/atom').times(3).reply(200, fixtures.atomRepo);

          nock('https://slack.com').post('/api/services.update').reply(200, { ok: true });

          const command = fixtures.slack.command({
            text: 'subscribe atom/atom',
            channel_id: 'C0D70MRAL',
          });

          await request.post('/slack/command').use(slackbot).send(command)
            .expect(200)
            .expect((res) => {
              expect(res.body).toMatchSnapshot();
            });

          const unsubscribeCommand = fixtures.slack.command({
            text: 'unsubscribe atom/atom',
            channel_id: 'C0D70MRAL',
          });

          await request.post('/slack/command').use(slackbot).send(unsubscribeCommand)
            .expect(200)
            .expect((res) => {
              expect(res.body).toMatchSnapshot();
            });

          // This does not result in a second call to services.update
          await request.post('/slack/command').use(slackbot).send(command)
            .expect(200)
            .expect((res) => {
              expect(res.body).toMatchSnapshot();
            });

          const subscription = await Subscription.findOne({
            where: {
              slackWorkspaceId: slackWorkspace.id,
              channelId: 'C0D70MRAL',
              githubId: fixtures.atomRepo.id,
            },
          });

          // Check that this new subscription has the default settings
          expect(subscription.settings).toEqual({});
        });
      });
    });
  });
});
