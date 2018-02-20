const request = require('supertest');

const helper = require('.');
const fixtures = require('../fixtures');

describe('Uninstalling the slack app', () => {
  beforeEach(async () => {
    const { Installation, SlackWorkspace, Subscription } = helper.robot.models;
    // Create an installation
    const installation = await Installation.create({
      githubId: 1,
      ownerId: fixtures.org.id,
    });

    const slackWorkspace = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxp-token',
    });

    await Subscription.create({
      githubId: 1234,
      channelId: 'C0012',
      slackWorkspaceId: slackWorkspace.id,
      installationId: installation.id,
    });

    await Subscription.create({
      githubId: 4321,
      channelId: 'C0234',
      slackWorkspaceId: slackWorkspace.id,
      installationId: installation.id,
    });

    await Subscription.create({
      githubId: 5678,
      channelId: 'C0012',
      slackWorkspaceId: slackWorkspace.id,
      installationId: installation.id,
    });
  });
  test('deletes all corresponding subscriptions', async () => {
    const { Subscription } = helper.robot.models;
    expect(await Subscription.count()).toBe(3);

    await request(helper.probot.server).post('/slack/events')
      .send({
        token: process.env.SLACK_VERIFICATION_TOKEN,
        team_id: 'T0001',
        event: {
          type: 'app_uninstalled',
        },
        type: 'event_callback',
      })
      .expect(200)

    expect(await Subscription.count()).toBe(0);
  });
});
