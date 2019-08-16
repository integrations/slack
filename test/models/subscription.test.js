const {
  Subscription, SlackWorkspace, Installation, SlackUser, DeletedSubscription,
} = require('.');

const { parseSettings } = require('../../lib/settings-helper');

function parse(input) {
  return parseSettings(input);
}

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
      type: 'repo',
    });

    expect(subscription.cacheKey()).toEqual(`channel#${workspace.id}#1`);
    expect(subscription.cacheKey('foo#1')).toEqual(`channel#${workspace.id}#1:foo#1`);
    expect(subscription.cacheKey('foo#1', 'bar#2')).toEqual(`channel#${workspace.id}#1:foo#1:bar#2`);
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
        type: 'repo',
      });
      const channels = await Subscription.lookup(resource, workspace.id);
      expect(channels).toEqual([
        expect.objectContaining({
          channelId: channel,
          slackWorkspaceId: workspace.id,
          githubId: resource,
        }),
      ]);
    });
    test('adding a subscription without creator throws an error', async () => {
      const resource = '1';
      const subscription = Subscription.subscribe({
        channelId: channel,
        githubId: resource,
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        type: 'repo',
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
        type: 'repo',
      });
      const [subscription] = await Subscription.lookup(resource, channel);
      expect(subscription.SlackWorkspace).toBeDefined();
      expect(subscription.SlackWorkspace.equals(workspace)).toBe(true);
    });
  });

  describe('unsubscribe', () => {
    test('removes subscriptions for resource', async () => {
      const resource = 1;
      const values = {
        channelId: channel,
        githubId: resource,
        creatorId: slackUser.id,
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        type: 'repo',
      };
      await Subscription.subscribe(values);
      await Subscription.unsubscribe(resource, channel, workspace.id);
      expect(await Subscription.lookup(resource)).toEqual([]);
      expect(await DeletedSubscription.findAll({ where: { ...values, reason: 'unsubscribe' } })).toHaveLength(1);
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

    test('enables and disables with string value', async () => {
      subscription.enable(parse('issues'));
      await subscription.save();
      expect((await subscription.reload()).settings).toEqual({ issues: true });

      subscription.enable(parse('pulls'));
      await subscription.save();
      expect((await subscription.reload()).settings).toEqual({ pulls: true, issues: true });

      subscription.disable(parse('pulls'));
      await subscription.save();
      expect((await subscription.reload()).settings).toEqual({ issues: true, pulls: false });

      subscription.disable(parse('issues'));
      await subscription.save();
      expect((await subscription.reload()).settings).toEqual({ pulls: false, issues: false });
    });

    test('enables and disables sub settings', async () => {
      subscription.enable(parse('commits:all'));
      expect(subscription.settings).toEqual({ commits: 'all' });

      subscription.disable(parse('commits:all'));
      expect(subscription.settings).toEqual({ commits: false });

      subscription.enable(parse('commits:all'));
      expect(subscription.settings).toEqual({ commits: 'all' });

      subscription.disable(parse('commits:all'));
      expect(subscription.settings).toEqual({ commits: false });
    });

    test('enables and disables with array values', () => {
      subscription.enable(parse(['issues', 'pulls']));
      expect(subscription.settings).toEqual({ pulls: true, issues: true });

      subscription.disable(parse(['issues', 'pulls']));
      expect(subscription.settings).toEqual({ pulls: false, issues: false });
    });

    test('initializes with given values', () => {
      subscription = new Subscription({
        channelId: channel,
        creatorId: slackUser.id,
        settings: { issues: true },
      });
      expect(subscription.settings).toEqual({ issues: true });
    });

    test('raises an error for unknown setting', async () => {
      subscription.enable(parse('time-travel'));
      await expect(subscription.save()).rejects.toThrowError('time-travel');
    });

    test('raises an error for unknown setting value', async () => {
      subscription.enable(parse(['commits:all']));
      await subscription.save();

      subscription.enable(parse('commits:wat?'));
      await expect(subscription.save()).rejects.toThrowError('commits:wat?');
    });

    test('raises an error for setting not accept value', async () => {
      subscription.enable(parse('reviews:label'));
      await expect(subscription.save()).rejects.toThrowError('reviews:label');
    });

    describe('label', () => {
      test('enables and disables with labels', () => {
        subscription.enable(parse(['label:todo', 'label:wip']));
        expect(subscription.settings).toEqual({ label: ['todo', 'wip'] });

        subscription.disable(parse('label:todo'));
        expect(subscription.settings).toEqual({ label: ['wip'] });

        subscription.disable(parse('label:wip'));
        expect(subscription.settings).toEqual({});
      });

      test('ignores duplicated label string', () => {
        subscription.enable(parse('label:todo label:todo'));
        expect(subscription.settings).toEqual({ label: ['todo'] });

        subscription.enable(parse('label:todo'));
        expect(subscription.settings).toEqual({ label: ['todo'] });

        subscription.disable(parse('label:wip'));
        expect(subscription.settings).toEqual({ label: ['todo'] });
      });

      test('ignores disabling unknown label string', () => {
        subscription.disable(parse('label:todo'));
        expect(subscription.settings).toEqual({});
      });

      test('accepts quoted spaces and colons as part of label string', async () => {
        subscription.enable(parse(['label:"help wanted"', 'label:priority:MUST']));
        expect(subscription.settings).toEqual({ label: ['help wanted', 'priority:MUST'] });
      });

      test('parsing, storing and loading works end to end for simple cases', async () => {
        subscription.enable(parse(['label:WIP', 'label:priority:MUST']));

        expect(subscription.settings).toEqual({ label: ['WIP', 'priority:MUST'] });

        await subscription.save();
        expect((await subscription.reload()).settings).toEqual({ label: ['WIP', 'priority:MUST'] });
      });

      test('parsing, storing and loading works end to end for complex cases', async () => {
        subscription.enable(parse(['label:"help wanted"', 'label:priority:MUST']));

        expect(subscription.settings).toEqual({ label: ['help wanted', 'priority:MUST'] });

        // ensure data is stored and loaded correctly
        await subscription.save();
        expect((await subscription.reload()).settings).toEqual({
          label: ['help wanted', 'priority:MUST'],
        });
      });

      test('does nothing if label has no value', async () => {
        subscription.enable(parse('label'));
        expect(subscription.settings).toEqual({});
      });

      test('handles invalid label value', async () => {
        subscription.enable(parse('label:todo,wip'));
        expect(subscription.settings).toEqual({});
      });
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
      // handles invalid values
      expect(subscription.isEnabledForGitHubEvent('lolwut?')).toBe(false);
    });

    test('returns true if subscription enabled', () => {
      subscription.enable(parse('comments'));
      expect(subscription.isEnabledForGitHubEvent('comments')).toBe(true);
    });

    test('returns true for enabled with settings', () => {
      subscription.enable(parse('commits:all'));
      expect(subscription.isEnabledForGitHubEvent('commits')).toBe(true);
    });

    test('returns false if subscription enabled', () => {
      subscription.disable(parse('issues'));
      expect(subscription.isEnabledForGitHubEvent('issues')).toBe(false);
    });

    test('maps GitHub event names to friendly values', () => {
      subscription.enable(parse('pulls'));
      expect(subscription.isEnabledForGitHubEvent('pull_request')).toBe(true);
    });
  });
});
