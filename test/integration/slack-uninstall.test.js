const request = require('supertest');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const {
  Installation, SlackWorkspace, SlackUser, Subscription, DeletedSubscription,
} = models;

describe('Uninstalling the slack app', () => {
  beforeEach(async () => {
    // Create an installation
    const installation = await Installation.create({
      githubId: 1,
      ownerId: fixtures.org.id,
    });

    const slackWorkspace = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxp-token',
    });

    const slackUser = await SlackUser.create({
      slackId: 'U88HS',
      slackWorkspaceId: slackWorkspace.id,
    });

    await Subscription.create({
      creatorId: slackUser.id,
      githubId: 1234,
      githubName: 'foo/repo1',
      channelId: 'C0012',
      slackWorkspaceId: slackWorkspace.id,
      installationId: installation.id,
      settings: { commits: true, pulls: true },
    });

    await Subscription.create({
      creatorId: slackUser.id,
      githubId: 4321,
      githubName: 'foo/repo2',
      channelId: 'C0234',
      slackWorkspaceId: slackWorkspace.id,
      installationId: installation.id,
      settings: { commits: true, pulls: true },
    });

    await Subscription.create({
      creatorId: slackUser.id,
      githubId: 5678,
      githubName: 'foo/repo3',
      channelId: 'C0012',
      slackWorkspaceId: slackWorkspace.id,
      installationId: installation.id,
      settings: { commits: true, pulls: true },
    });
  });
  test('deletes all corresponding subscriptions', async () => {
    expect(await Subscription.count()).toBe(3);

    await request(probot.server).post('/slack/events')
      .send({
        token: process.env.SLACK_VERIFICATION_TOKEN,
        team_id: 'T0001',
        event: {
          type: 'app_uninstalled',
        },
        type: 'event_callback',
      })
      .expect(200);

    expect(await Subscription.count()).toBe(0);
    const deletedSubscriptions = await DeletedSubscription.findAll({ where: { reason: 'slack app uninstalled' }, order: ['channelId'] });
    expect(deletedSubscriptions).toHaveLength(3);
    expect(deletedSubscriptions[0].dataValues).toMatchSnapshot({
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      deletedAt: expect.any(Date),
    });
    expect(deletedSubscriptions[1].dataValues).toMatchSnapshot({
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      deletedAt: expect.any(Date),
    });
    expect(deletedSubscriptions[2].dataValues).toMatchSnapshot({
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      deletedAt: expect.any(Date),
    });
  });
});
