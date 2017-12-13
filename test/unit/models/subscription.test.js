const { Subscription, SlackWorkspace } = require('.');

describe('model: Subscription', () => {
  let workspace;
  const channel = 'C0001';

  beforeEach(async () => {
    workspace = await SlackWorkspace.create({
      slackId: 'T001',
      accessToken: 'test',
    });
  });

  describe('subscribe', () => {
    test('add subscription for resource', async () => {
      const resource = '1';
      await Subscription.subscribe(resource, channel, workspace.id);
      const channels = await Subscription.lookup(resource, workspace.id);
      expect(channels).toEqual([expect.objectContaining({
        channelId: channel,
        slackWorkspaceId: workspace.id,
        githubId: resource,
      })]);
    });

    test('does not duplicate subscriptions', async () => {
      const resource = 1;
      await Subscription.subscribe(resource, channel, workspace.id);
      const subscription = await Subscription.subscribe(resource, channel, workspace.id);
      const channels = await Subscription.lookup(resource);
      expect(channels.length).toEqual(1);
      expect(channels[0].id).toEqual(subscription.id);
    });
  });

  describe('lookup', () => {
    test('returns the workspace', async () => {
      const resource = 1;
      await Subscription.subscribe(resource, channel, workspace.id);
      const [subscription] = await Subscription.lookup(resource, channel);
      expect(subscription.SlackWorkspace).toBeDefined();
      expect(subscription.SlackWorkspace.equals(workspace)).toBe(true);
    });
  });

  describe('unsubscribe', () => {
    test('removes subscriptions for resource', async () => {
      const resource = 1;
      await Subscription.subscribe(resource, channel, workspace.id);
      await Subscription.unsubscribe(resource, channel, workspace.id);
      expect(await Subscription.lookup(resource)).toEqual([]);
    });
  });
});
