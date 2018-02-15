const {
  Subscribed, NotFound, NotSubscribed,
} = require('../renderer/flow');

const SubscriptionRequest = require('./subscription-request');

/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe https://github.com/org/repo
 */
module.exports = async (req, res) => {
  const { robot } = res.locals;
  const command = req.body;

  const s = new SubscriptionRequest(req.body, res.locals, robot.models);

  if (command.subcommand === 'subscribe') {
    try {
      const subscription = await s.subscribe();
      const { repository } = subscription;
      return res.json(new Subscribed({ subscription, repository }));
    } catch (err) {
      if (err.code === 404) {
        req.log.trace({ err }, "couldn't find repo");
        return res.json(new NotFound(command.args[0]));
      }
      throw err;
    }
  } else if (command.subcommand === 'unsubscribe') {
    const subscription = await s.unsubscribe();
    const { repository } = subscription || {};
    if (!subscription) {
      return res.json(new NotSubscribed(command.args[0]));
    } if (s.settings) {
      return res.json(new Subscribed({ subscription, repository }));
    }
    return res.json(new Subscribed({ subscription, repository, unsubscribed: true }));
  }
};
