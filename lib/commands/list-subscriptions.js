const { Subscription, Installation } = require('../models');
const SubscriptionList = require('../messages/subscription-list');
const { Help } = require('../messages/flow');
const getRepositories = require('../github/get-repositories');

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

  const repositories = await getRepositories(subscriptions, robot);

  if (command.text === 'list') {
    return command.respond(new SubscriptionList(repositories));
  }

  const response = (new Help(command.command, command.subcommand)).toJSON();
  const list = new SubscriptionList(repositories);
  response.attachments.push(list.toJSON().attachments[0]);
  return command.respond(response);
};
