const { Subscription, Installation } = require('../models');
const SubscriptionList = require('../messages/subscription-list');
const { Help } = require('../messages/flow');

/**
 * Lists all subscriptions in a slack channel
 *
 * Usage:
 *   /github subscribe list
 */
module.exports = async (req, res, next) => {
  const { robot, command } = res.locals;

  if (command.text !== '' && command.text !== 'list') {
    next();
    return;
  }

  const subscriptions = await Subscription.findAll({
    include: [Installation],
    where: { channelId: command.channel_id },
  });

  let resources = await Promise.all(subscriptions.map(async (subscription) => {
    const github = await robot.auth(subscription.Installation.githubId);
    let githubResource;

    try {
      githubResource = await github.repos.getById({ id: subscription.githubId });
      return githubResource.data;
    } catch (err) {
      if (err.code !== 404) {
        throw err;
      }
    }

    try {
      githubResource = await github.users.getById({ id: subscription.githubId });
      return githubResource.data;
    } catch (err) {
      if (err.code !== 404) {
        throw err;
      }
    }

    req.log.error({ githubId: subscription.githubId }, 'Could not find resource for subscription');
  }));

  // remove undefined
  resources = resources.filter(repo => repo);

  if (command.text === 'list') {
    return command.respond(new SubscriptionList(resources, command.channel_id));
  }

  const response = (new Help(command.command, command.subcommand)).toJSON();
  const list = new SubscriptionList(resources, command.channel_id);
  response.attachments.push(list.toJSON().attachments[0]);
  return command.respond(response);
};
