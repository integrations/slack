const {
  Subscribed, NotFound, AlreadySubscribed, NotSubscribed, UpdatedSettings,
} = require('../../messages/flow');

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
  const { command } = res.locals;

  req.log.debug({ installation, resource }, 'Lookup respository to subscribe');

  async function respondWith(message) {
    if (/api\.slack\.com/.test(req.headers['user-agent'])) {
      res.json(message);
    } else {
      await command.respond(message.toJSON());
      res.redirect(`https://slack.com/app_redirect?channel=${command.channel_id}&team=${command.team_id}`);
    }
  }

  // look up the resource
  let from;
  try {
    from = (await gitHubUser.client.repos.get({ owner: resource.owner, repo: resource.repo })
    ).data;
  } catch (err) {
    req.log.debug({ err }, 'Could not find repository');
    return respondWith(new NotFound(command.args[0]));
  }
  const to = command.channel_id;

  let subscription = await Subscription.lookupOne(from.id, to, slackWorkspace.id, installation.id);
  const settings = command.args[1];

  if (command.subcommand === 'subscribe') {
    if (subscription) {
      if (settings) {
        req.log.debug({ settings }, 'Subscription already exists, updating settings');
        subscription.enable(settings);
        await subscription.save();
        respondWith(new UpdatedSettings({ subscription, repository: from }));
      }
      req.log.debug('Subscription already exists');
      return respondWith(new AlreadySubscribed(command.args[0]));
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

    await LegacySubscription.migrate(subscription);

    await respondWith(new Subscribed({ channelId: to, fromRepository: from }));
  } else if (command.subcommand === 'unsubscribe') {
    if (subscription) {
      if (settings) {
        subscription.disable(settings);
        await subscription.save();

        return respondWith(new UpdatedSettings({ subscription, repository: from }));
      }
      await Subscription.unsubscribe(from.id, to, slackWorkspace.id);
      return respondWith(new Subscribed({
        channelId: to,
        fromRepository: from,
        unsubscribed: true,
      }));
    }
    return respondWith(new NotSubscribed(command.args[0]));
  }
};
