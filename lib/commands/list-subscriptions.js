const { Subscription, Installation, SlackWorkspace } = require('../models');
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

  if (command.text !== '' && !command.text.startsWith('list')) {
    next();
    return;
  }

  const subscriptions = await Subscription.findAll({
    include: [Installation, SlackWorkspace],
    where: { channelId: command.channel_id, '$SlackWorkspace.slackId$': command.team_id },
  });

  const repositories = await getRepositories(subscriptions.filter(s => s.type === 'repo'), robot);
  const accounts = await getAccounts(subscriptions.filter(s => s.type === 'account'), robot);

  if (command.text === '') {
    // When a user types the following incomplete command /github subcribe

    const response = (new Help(command.command, command.subcommand)).toJSON();
    const list = new SubscriptionList(subscriptions, repositories, accounts);
    response.attachments.push(list.toJSON().attachments[0]);
    return command.respond(response);
  }

  if (command.text.startsWith('list')) {
    return command.respond(new SubscriptionList(subscriptions, repositories, accounts, command.text.includes('features')));
  }
};
