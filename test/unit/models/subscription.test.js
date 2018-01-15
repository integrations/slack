const { Subscription, SlackWorkspace, Installation } = require('.');

describe('model: Subscription', () => {
  let workspace;
  let installation;
  const channel = 'C0001';

  beforeEach(async () => {
    workspace = await SlackWorkspace.create({
      slackId: 'T001',
      accessToken: 'test',
    });
    installation = await Installation.create({
      ownerId: 1,
      githubId: 1,
    });
  });

  describe('subscribe', () => {
    test('add subscription for resource', async () => {
      const resource = '1';
      await Subscription.subscribe(resource, channel, workspace.id, installation.id);
      const channels = await Subscription.lookup(resource, workspace.id);
      expect(channels).toEqual([expect.objectContaining({
        channelId: channel,
        slackWorkspaceId: workspace.id,
        githubId: resource,
      })]);
    });
  });

  describe('lookup', () => {
    test('returns the workspace', async () => {
      const resource = 1;
      await Subscription.subscribe(resource, channel, workspace.id, installation.id);
      const [subscription] = await Subscription.lookup(resource, channel);
      expect(subscription.SlackWorkspace).toBeDefined();
      expect(subscription.SlackWorkspace.equals(workspace)).toBe(true);
    });
  });

  describe('unsubscribe', () => {
    test('removes subscriptions for resource', async () => {
      const resource = 1;
      await Subscription.subscribe(resource, channel, workspace.id, installation.id);
      await Subscription.unsubscribe(resource, channel, workspace.id);
      expect(await Subscription.lookup(resource)).toEqual([]);
    });
  });
});
