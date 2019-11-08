const logger = require('../logger');

module.exports = async (subscriptions, robot) => {
  const accounts = await Promise.all(subscriptions.map(async (subscription) => {
    const github = await robot.auth(subscription.Installation.githubId);
    try {
      const account = await github.request('GET /user/:id', { id: subscription.githubId });
      return account.data;
    } catch (err) {
      logger.error({ err, accountId: subscription.githubId }, 'Could not find account for subscription');
      if (err.code !== 404) {
        throw err;
      }
    }
  }));

  // remove undefined
  return accounts.filter(Boolean);
};
