const { SubscriptionList } = require('../renderer/flow');

/**
 * Lists all subscriptions in a slack channel
 *
 * Usage:
 *   /github list
 */
module.exports = async (req, res) => {
  const { robot } = res.locals;
  const { Subscription } = robot.models;
  const command = req.body;

  const subscriptions = await Subscription.findAll({ where: { channelId: command.channel_id } });
  // Make http request for each subscription in list to get full name

  res.json(new SubscriptionList(subscriptions, command.channel_id));
};
