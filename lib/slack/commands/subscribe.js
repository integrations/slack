const {
  Subscribed, NotFound, AlreadySubscribed, NotSubscribed,
} = require('../renderer/flow');

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
  const settings = command.args[1];

  if (command.subcommand === 'subscribe') {
    if (!subscription) {
      req.log.debug('Subscription does not exist, creating.');
      subscription = await Subscription.subscribe({
        channelId: to,
        creatorId: slackUser.id,
        githubId: from.id,
        installationId: installation.id,
        settings,
        slackWorkspaceId: slackWorkspace.id,
      });
    }

    if (settings) {
      req.log.debug({ settings }, 'Updating settings');
      subscription.enable(settings);
      await subscription.save();
      return res.json(new Subscribed({
        channelId: to,
        fromRepository: from,
      }));
    }

    // FIXME: eager load this when fetching the Subscription
    subscription.SlackWorkspace = slackWorkspace;

    await LegacySubscription.migrate(subscription);

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
    return res.json(new NotSubscribed(command.args[0]));
  }
};
