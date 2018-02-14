
const SubscriptionList = require('../renderer/subscription-list');
const { Help } = require('../renderer/flow');

/**
 * Lists all subscriptions in a slack channel
 *
 * Usage:
 *   /github subscribe list
 */
module.exports = async (req, res, next) => {
  const { robot } = res.locals;
  const { Subscription, Installation } = robot.models;
  const command = req.body;
  if (command.text !== '' && command.text !== 'list') {
    next();
    return;
  }

  const subscriptions = await Subscription.findAll({
    include: [Installation],
    where: { channelId: command.channel_id },
  });

  const repositories = await Promise.all(subscriptions.map(async (subscription) => {
    const github = await robot.auth(subscription.Installation.githubId);
    const repository = await github.repos.getById({ id: subscription.githubId });
    return repository.data;
  }));

  if (command.text === 'list') {
    return res.json(new SubscriptionList(repositories, command.channel_id));
  }

  const response = (new Help(req.body.command, req.body.subcommand)).toJSON();
  const list = new SubscriptionList(repositories, command.channel_id);
  response.attachments.push(list.toJSON().attachments[0]);
  return res.json(response);
};
