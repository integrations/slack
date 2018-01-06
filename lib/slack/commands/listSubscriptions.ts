const { SubscriptionList } = require('../renderer/native');

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
  if (command.text !== 'list') {
    next();
    return;
  }

  const subscriptions = await Subscription.findAll({
    where: { channelId: command.channel_id },
    include: [Installation],
  });
  const repositories = await Promise.all(subscriptions.map(async (subscription) => {
    const github = await robot.auth(subscription.Installation.githubId);
    const repository = await github.repos.getById({ id: subscription.githubId });
    return repository.data;
  }));

  res.json(new SubscriptionList(repositories, command.channel_id));
};
