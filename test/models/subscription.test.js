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

  test('cacheKey', async () => {
    const subscription = await Subscription.subscribe({
      channelId: 1,
      githubId: 2,
      creatorId: slackUser.id,
      slackWorkspaceId: workspace.id,
      installationId: installation.id,
    });

    expect(subscription.cacheKey()).toMatch(/subscription#\d+/);
    expect(subscription.cacheKey('foo#1')).toMatch(/subscription#\d+:foo#1/);
    expect(subscription.cacheKey('foo#1', 'bar#2')).toMatch(/subscription#\d+:foo#1:bar#2/);
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

    test('enables and disables with string value', async () => {
      subscription.enable('issues');
      await subscription.save();
      expect((await subscription.reload()).settings).toEqual({ issues: true });

      subscription.enable('pulls');
      await subscription.save();
      expect((await subscription.reload()).settings).toEqual({ pulls: true, issues: true });

      subscription.disable('pulls');
      await subscription.save();
      expect((await subscription.reload()).settings).toEqual({ issues: true, pulls: false });

      subscription.disable('issues');
      await subscription.save();
      expect((await subscription.reload()).settings).toEqual({ pulls: false, issues: false });
    });

    test('enables and disables sub settings', async () => {
      subscription.enable('commits:all');
      expect(subscription.settings).toEqual({ commits: 'all' });

      subscription.disable('commits:all');
      expect(subscription.settings).toEqual({ commits: false });

      subscription.enable(['commits:all']);
      expect(subscription.settings).toEqual({ commits: 'all' });

      subscription.disable(['commits:all']);
      expect(subscription.settings).toEqual({ commits: false });
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

    test('raises an error for unknown setting', async () => {
      subscription.enable('time-travel');
      await expect(subscription.save()).rejects.toThrowErrorMatchingSnapshot();
    });

    test('raises an error for unknown setting value', async () => {
      subscription.enable('commits:all');
      await subscription.save();

      subscription.enable('commits:wat?');
      await expect(subscription.save()).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe('isEnabledForGitHubEvent', () => {
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

    test('defaults', () => {
      // enabled by default
      expect(subscription.isEnabledForGitHubEvent('issues')).toBe(true);
      expect(subscription.isEnabledForGitHubEvent('pulls')).toBe(true);
      expect(subscription.isEnabledForGitHubEvent('statuses')).toBe(true);
      expect(subscription.isEnabledForGitHubEvent('deployments')).toBe(true);
      expect(subscription.isEnabledForGitHubEvent('public')).toBe(true);
      expect(subscription.isEnabledForGitHubEvent('commits')).toBe(true);
      expect(subscription.isEnabledForGitHubEvent('status')).toBe(true);
      expect(subscription.isEnabledForGitHubEvent('deployment_status')).toBe(true);
      expect(subscription.isEnabledForGitHubEvent('push')).toBe(true);

      // disabled by default
      expect(subscription.isEnabledForGitHubEvent('issue_comment')).toBe(false);
      expect(subscription.isEnabledForGitHubEvent('lolwut?')).toBe(false);
    });

    test('returns true if subscription enabled', () => {
      subscription.enable('comments');
      expect(subscription.isEnabledForGitHubEvent('comments')).toBe(true);
    });

    test('returns true for enabled with settings', () => {
      subscription.enable('commits:all');
      expect(subscription.isEnabledForGitHubEvent('commits')).toBe(true);
    });

    test('returns false if subscription enabled', () => {
      subscription.disable('issues');
      expect(subscription.isEnabledForGitHubEvent('issues')).toBe(false);
    });

    test('maps GitHub event names to friendly values', () => {
      subscription.enable('pulls');
      expect(subscription.isEnabledForGitHubEvent('pull_request')).toBe(true);
    });
  });
});
