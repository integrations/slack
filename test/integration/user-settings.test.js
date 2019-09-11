const request = require('supertest');
const nock = require('nock');

const { probot, slackbot, models } = require('.');
const fixtures = require('../fixtures');

describe('Integration: User settings', () => {
  let slackUser;
  beforeEach(async () => {
    const { SlackWorkspace, SlackUser } = models;
    const workspace = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxp-token',
      botAccessToken: 'xoxb-token',
    });
    slackUser = await SlackUser.create({
      slackId: 'U2147483697',
      slackWorkspaceId: workspace.id,
    });
  });
  test('unauthenticated user is prompted to authenticate first', async () => {
    const command = fixtures.slack.command({
      text: 'settings',
    });
    const res = await request(probot.server).post('/slack/command')
      .use(slackbot)
      .send(command)
      .expect(200);
    const { text } = res.body.attachments[0].actions[0];
    expect(text).toMatch('Connect GitHub account');
  });
  describe('authenticated user', () => {
    beforeEach(async () => {
      const { GitHubUser } = models;
      const githubUser = await GitHubUser.create({
        id: 2,
        accessToken: 'github-token',
      });
      await slackUser.update({
        githubId: githubUser.id,
      });
    });

    test('with no settings configured gets message stating that', async () => {
      const command = fixtures.slack.command({
        text: 'settings',
      });
      await request(probot.server).post('/slack/command')
        .send(command)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    test('with both automatic unfurls configured and prompts muted sees both settings', async () => {
      await slackUser.update({
        settings: {
          unfurlPrivateResources: {
            12345: ['all'],
            54321: ['C12345'],
          },
          muteUnfurlPromptsIndefinitely: true,
        },
      });

      nock('https://api.github.com').get('/repositories/12345').reply(200, {
        id: 12345,
        full_name: 'atom/atom',
      });

      nock('https://api.github.com').get('/repositories/54321').reply(200, {
        id: 54321,
        full_name: 'kubernetes/kubernetes',
      });

      const command = fixtures.slack.command({
        text: 'settings',
      });
      await request(probot.server).post('/slack/command')
        .send(command)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    test('with just auto unfurls configured sees just that setting', async () => {
      await slackUser.update({
        settings: {
          unfurlPrivateResources: {
            12345: ['all'],
            54321: ['C12345'],
          },
        },
      });
      nock('https://api.github.com').get('/repositories/12345').reply(200, {
        id: 12345,
        full_name: 'atom/atom',
      });

      nock('https://api.github.com').get('/repositories/54321').reply(200, {
        id: 54321,
        full_name: 'kubernetes/kubernetes',
      });

      const command = fixtures.slack.command({
        text: 'settings',
      });
      await request(probot.server).post('/slack/command')
        .send(command)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    test('with just prompts muted sees just that setting', async () => {
      await slackUser.update({
        settings: {
          muteUnfurlPromptsIndefinitely: true,
        },
      });

      const command = fixtures.slack.command({
        text: 'settings',
      });
      await request(probot.server).post('/slack/command')
        .send(command)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    test('with prompts muted temporarily sees setting showing time remaining', async () => {
      Date.now = jest.fn(() => new Date(Date.UTC(2018, 4, 4)).valueOf());
      await slackUser.update({
        settings: {
          muteUnfurlPromptsUntil: 1525398771,
        },
      });

      const command = fixtures.slack.command({
        text: 'settings',
      });
      await request(probot.server).post('/slack/command')
        .send(command)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    test('with prompts muted temporarily doesn\'t see setting showing time remaining', async () => {
      Date.now = jest.fn(() => new Date(Date.UTC(2018, 4, 4)).valueOf());
      await slackUser.update({
        settings: {
          muteUnfurlPromptsUntil: 1522713600,
        },
      });

      const command = fixtures.slack.command({
        text: 'settings',
      });
      await request(probot.server).post('/slack/command')
        .send(command)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    describe('with both settings configured', () => {
      beforeEach(async () => {
        await slackUser.update({
          settings: {
            unfurlPrivateResources: {
              12345: ['all'],
              54321: ['C12345'],
            },
            muteUnfurlPromptsIndefinitely: true,
          },
        });
      });
      test('selects repo for which to stop autounfurls and is presented with a follow up message', async () => {
        await request(probot.server).post('/slack/actions').send({
          payload: JSON.stringify(fixtures.slack.action.unfurlSettingsAutoGetSettingsForRepo()),
        })
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
      });
      test('confirms removal of autounfurl removes repo from settings and posts confirmation message to user', async () => {
        await request(probot.server).post('/slack/actions').send({
          payload: JSON.stringify(fixtures.slack.action.unfurlSettingsAutoRemoveRepo()),
        })
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
        await slackUser.reload();
        expect(slackUser.settings.unfurlPrivateResources).toEqual({
          54321: ['C12345'],
        });
      });
      test('clicks unmute button and sees confirmation message', async () => {
        await request(probot.server).post('/slack/actions').send({
          payload: JSON.stringify(fixtures.slack.action.unfurlSettingsUnmutePrompts()),
        })
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchSnapshot();
          });
        await slackUser.reload();
        expect(slackUser.settings.muteUnfurlPromptsIndefinitely).toBe(false);
      });
    });
  });
});
