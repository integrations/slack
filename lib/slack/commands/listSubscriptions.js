const { SubscriptionList } = require('../renderer/flow');

/**
 * Lists all subscriptions in a slack channel
 *
 * Usage:
 *   /github subscribe list
 */
module.exports = async (req, res) => {
  const { robot } = res.locals;
  const { Subscription } = robot.models;
  const command = req.body;

  const subscriptions = await Subscription.findAll({ where: { channelId: command.channel_id } });
  // Options:
  // 1: Query with relevant installation id for each subscription. (Need 1 extra http request to find owner (not clear how to make that http request))
  // 2: Query with user token (won't be able to resolve ids for repos the user doesn't have access to)
  // Potential solution: Store both owner id and repo id in the database
  // Make http request for each subscription in list to get full name
  // Need to auth as the user, because almost impossible to determine what the right installation id is
  // Need the user to have connected their github account
  const repositories = Promise.all(subscriptions.map(async (subscription) => {
    const github = await robot.auth();
    const repository = await github.repos.getById({ id: subscription.githubId });
    console.log(repository);
    return repository.data;
  }));
  console.log(repositories);

  res.json(new SubscriptionList(repositories, command.channel_id));
};
