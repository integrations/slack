const helper = require('.');
const installationCreated = require('../fixtures/webhooks/installation.created.json');
const installationDeleted = require('../fixtures/webhooks/installation.deleted.json');

describe('Integration: tracking GitHub installations', () => {
  test('installation created records', async () => {
    const { robot } = helper;
    const { Installation } = robot.models;

    await robot.receive({
      event: 'installation',
      payload: installationCreated,
    });

    let installation = await Installation.findOne({
      where: { githubId: installationCreated.installation.id },
    });

    expect(installation).toBeTruthy();

    await robot.receive({
      event: 'installation',
      payload: installationDeleted,
    });

    installation = await Installation.findOne({
      where: { githubId: installationCreated.installation.id },
    });

    expect(installation).toBe(null);
  });

  test('deleting installation does not cascade to delete subscriptions', async () => {
    const { robot } = helper;
    const { Subscription, Installation, SlackWorkspace } = robot.models;

    await robot.receive({
      event: 'installation',
      payload: installationCreated,
    });

    const installation = await Installation.findOne({
      where: { githubId: installationCreated.installation.id },
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

    expect(await Subscription.count()).toBe(1);

    await robot.receive({
      event: 'installation',
      payload: installationDeleted,
    });

    expect(await Subscription.count()).toBe(1);
  });
});
