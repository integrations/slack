const { createClient } = require('../slack/client');

// Temporary "middleware" hack to look up routing before delivering event
module.exports = ({ models }) => {
  const { Subscription } = models;

  return function route(callback) {
    return async (context) => {
      // FIXME: we should be able to route all messages, even if there isn't a repo
      if (context.payload.repository) {
        const subscriptions = await Subscription.lookup(context.payload.repository.id);

        context.log.debug({ subscriptions }, 'Delivering to subscribed channels');

        return Promise.all(subscriptions.map(async (subscription) => {
          // Create clack client with workspace token
          const slack = createClient(subscription.SlackWorkspace.accessToken);

          return callback(context, subscription, slack);
        }));
      }
    };
  };
};
