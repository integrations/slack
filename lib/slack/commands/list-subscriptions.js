
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

  let repositories = await Promise.all(subscriptions.map(async (subscription) => {
    const github = await robot.auth(subscription.Installation.githubId);
    try {
      const repository = await github.repos.getById({ id: subscription.githubId });
      return repository.data;
    } catch (err) {
      req.log.error({ err, repoId: subscription.githubId }, 'Could not find repository for subscription');
      if (err.code !== 404) {
        throw err;
      }
    }
  }));

  // remove undefined
  repositories = repositories.filter(repo => repo);

  if (command.text === 'list') {
    return res.json(new SubscriptionList(repositories, command.channel_id));
  }

  const response = (new Help(req.body.command, req.body.subcommand)).toJSON();
  const list = new SubscriptionList(repositories, command.channel_id);
  response.attachments.push(list.toJSON().attachments[0]);
  return res.json(response);
};
