const {
  Subscribed, NotFound, AlreadySubscribed, NotSubscribed,
} = require('../renderer/flow');
const slack = require('../client');

/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe https://github.com/org/repo
 */
module.exports = async (req, res) => {
  const {
    robot, resource, installation, gitHubUser, slackWorkspace, slackUser,
  } = res.locals;
  const { Subscription, LegacySubscription } = robot.models;
  const command = req.body;

  req.log.debug({ installation, resource }, 'Lookup respository to subscribe');

  // look up the resource
  let from;
  try {
    from = (await gitHubUser.client.repos.get({ owner: resource.owner, repo: resource.repo })
    ).data;
  } catch (e) {
    req.log.trace(e, "couldn't find repo");
    return res.json(new NotFound(command.args[0]));
  }
  const to = command.channel_id;

  let subscription = await Subscription.lookupOne(from.id, to, slackWorkspace.id, installation.id);
  const settings = req.body.args[1];

  if (command.subcommand === 'subscribe') {
    if (subscription) {
      if (settings) {
        req.log.debug({ settings }, 'Subscription already exists, updating settings');
        subscription.enable(settings);
        await subscription.save();
        return res.json(new Subscribed({
          channelId: to,
          fromRepository: from,
        }));
      }
      req.log.debug('Subscription already exists');
      return res.json(new AlreadySubscribed(req.body.args[0]));
    }
    req.log.debug('Subscription does not exist, creating.');
    subscription = await Subscription.subscribe({
      channelId: to,
      creatorId: slackUser.id,
      githubId: from.id,
      installationId: installation.id,
      settings,
      slackWorkspaceId: slackWorkspace.id,
    });

    // check if there are any legacy configurations that we can disable
    const legacySubscriptions = await LegacySubscription.findAll({
      where: {
        activatedAt: null,
        channelSlackId: to,
        repoGitHubId: from.id,
        workspaceSlackId: slackWorkspace.slackId,
      },
    });
    await Promise.all(legacySubscriptions.map(async (legacySubscription) => {
      // call Slack API to disable subscription
      // eslint-disable-next-line no-underscore-dangle
      const payload = {
        payload: JSON.stringify({
          action: 'mark_subscribed',
          repo: {
            full_name: legacySubscription.repoFullName,
            id: legacySubscription.repoGitHubId,
          },
          service_type: 'github',
        }),
        service: legacySubscription.serviceSlackId,
      };
      req.log.debug('Removing legacy configuration', payload);

      const client = slack.createClient(slackWorkspace.accessToken);
      // eslint-disable-next-line no-underscore-dangle
      const configurationRemovalRes = await client._makeAPICall('services.update', payload);
      req.log.debug('Removed legacy configuration', configurationRemovalRes);

      const config = legacySubscription.originalSlackConfiguration;
      await subscription.update({
        settings: {
          branches: subscription.settings.branches || config.do_branches,
          comments: subscription.settings.comments || config.do_issue_comments,
          commits: subscription.settings.commits || config.do_commits,
          deployments: subscription.settings.deployments || config.do_deployment_status,
          issues: subscription.settings.issues || config.do_issues,
          pulls: subscription.settings.pulls || config.do_pullrequest,
          reviews: subscription.settings.reviews || config.do_pullrequest_reviews,
        },
      });

      return legacySubscription.update({
        activatedAt: new Date(),
      });
    }));
    return res.json(new Subscribed({
      channelId: to,
      fromRepository: from,
    }));
  } else if (command.subcommand === 'unsubscribe') {
    if (subscription) {
      if (settings) {
        subscription.disable(settings);
        await subscription.save();

        return res.json(new Subscribed({
          channelId: to,
          fromRepository: from,
        }));
      }
      await Subscription.unsubscribe(from.id, to, slackWorkspace.id);
      return res.json(new Subscribed({
        channelId: to,
        fromRepository: from,
        unsubscribed: true,
      }));
    }
    return res.json(new NotSubscribed(req.body.args[0]));
  }
};
