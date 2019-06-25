const logger = require('../logger');

module.exports = async (subscriptions, robot) => {
  const repositories = await Promise.all(subscriptions.map(async (subscription) => {
    const github = await robot.auth(subscription.Installation.githubId);
    try {
      const repository = await github.request('GET /repositories/:id', { id: subscription.githubId });
      return repository.data;
    } catch (err) {
      logger.error({ err, repoId: subscription.githubId }, 'Could not find repository for subscription');
      if (err.code !== 404) {
        throw err;
      }
    }
  }));

  // remove undefined
  return repositories.filter(Boolean);
};
