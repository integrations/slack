const {
  Subscription, SlackWorkspace, Installation, SlackUser,
} = require('.');

describe('model: Subscription', () => {
  let workspace;
  let installation;
  let slackUser;
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
    slackUser = await SlackUser.create({
      slackId: 'U01',
      slackWorkspaceId: workspace.id,
    });
  });

  describe('subscribe', () => {
    test('add subscription for resource', async () => {
      const resource = '1';
      await Subscription.subscribe({
        channelId: channel,
        githubId: resource,
        creatorId: slackUser.id,
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
      });
      const channels = await Subscription.lookup(resource, workspace.id);
      expect(channels).toEqual([expect.objectContaining({
        channelId: channel,
        slackWorkspaceId: workspace.id,
        githubId: resource,
      })]);
    });
    test('adding a subscription without creator throws an error', async () => {
      const resource = '1';
      const subscription = Subscription.subscribe({
        channelId: channel,
        githubId: resource,
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
      });
      await expect(subscription).rejects.toThrow();
    });
  });

  describe('lookup', () => {
    test('returns the workspace', async () => {
      const resource = 1;
      await Subscription.subscribe({
        channelId: channel,
        githubId: resource,
        creatorId: slackUser.id,
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
      });
      const [subscription] = await Subscription.lookup(resource, channel);
      expect(subscription.SlackWorkspace).toBeDefined();
      expect(subscription.SlackWorkspace.equals(workspace)).toBe(true);
    });
  });

  describe('unsubscribe', () => {
    test('removes subscriptions for resource', async () => {
      const resource = 1;
      await Subscription.subscribe({
        channelId: channel,
        githubId: resource,
        creatorId: slackUser.id,
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
      });
      await Subscription.unsubscribe(resource, channel, workspace.id);
      expect(await Subscription.lookup(resource)).toEqual([]);
    });
  });

  describe('settings', () => {
    let subscription;

    beforeEach(async () => {
      subscription = await Subscription.create({
        channelId: channel,
        githubId: 1,
        creatorId: slackUser.id,
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
      });
    });

    test('defaults to an empty object', async () => {
      expect(subscription.settings).toEqual({});
    });

    test('sets new values', async () => {
      await subscription.update({ settings: { issues: false } });
      await subscription.reload();

      expect(subscription.settings).toEqual({ issues: false });
    });

    test('enables and disables with string value', () => {
      subscription.enable('issues');
      expect(subscription.settings).toEqual({ issues: true });

      subscription.enable('pulls');
      expect(subscription.settings).toEqual({ pulls: true, issues: true });

      subscription.disable('pulls');
      expect(subscription.settings).toEqual({ issues: true, pulls: false });

      subscription.disable('issues');
      expect(subscription.settings).toEqual({ pulls: false, issues: false });
    });

    test('enables and disables with array values', () => {
      subscription.enable(['issues', 'pulls']);
      expect(subscription.settings).toEqual({ pulls: true, issues: true });

      subscription = new Subscription({ settings: ['issues', 'pulls'] });
      expect(subscription.settings).toEqual({ pulls: true, issues: true });

      subscription.disable(['issues', 'pulls']);
      expect(subscription.settings).toEqual({ pulls: false, issues: false });
    });

    test('initializes with enabled values', () => {
      subscription = new Subscription({ settings: 'issues' });
      expect(subscription.settings).toEqual({ issues: true });
    });

    test.skip('raises an error for unknown values', () => {
      expect(() => subscription.enable('time-travel')).toThrow(RangeError);
      expect(subscription.settings).toEqual({});
    });
  });
});
