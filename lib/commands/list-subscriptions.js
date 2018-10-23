const { Subscription, Installation } = require('../models');
const SubscriptionList = require('../messages/subscription-list');
const { Help } = require('../messages/flow');
const getRepositories = require('../github/get-repositories');
const getAccounts = require('../github/get-accounts');

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

  const repositories = await getRepositories(subscriptions.filter(s => s.type === 'repo'), robot);
  const accounts = await getAccounts(subscriptions.filter(s => s.type === 'account'), robot);

  if (command.text === 'list') {
    return command.respond(new SubscriptionList(repositories, accounts));
  }

  const response = (new Help(command.command, command.subcommand)).toJSON();
  const list = new SubscriptionList(repositories, accounts);
  response.attachments.push(list.toJSON().attachments[0]);
  return command.respond(response);
};
