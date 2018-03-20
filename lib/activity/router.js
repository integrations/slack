const { ReEnableSubscription } = require('../messages/flow');

// Temporary "middleware" hack to look up routing before delivering event
module.exports = ({ models }) => {
  const { Subscription, SlackUser, GitHubUser } = models;

  return function route(callback) {
    return async (context) => {
      if (context.payload.repository) {
        const subscriptions = await Subscription.lookup(context.payload.repository.id);

        context.log.debug({ subscriptions }, 'Delivering to subscribed channels');

        return Promise.all(subscriptions.map(async (subscription) => {
          if (!subscription.isEnabledForGitHubEvent(context.event)) {
            return;
          }

          // Create clack client with workspace token
          const slack = subscription.SlackWorkspace.client;
          if (!subscription.creatorId) {
            return callback(context, subscription, slack);
          }

          // Verify that subscription creator still has access to the resource
          const creator = await SlackUser.findById(subscription.creatorId, {
            include: [GitHubUser],
          });

          const eventType = `${context.event}.${context.payload.action}`;

          // Can't check for repo access because repo has been deleted
          if (eventType === 'repository.deleted') {
            return callback(context, subscription, slack);
          }

          if (!await creator.GitHubUser.hasRepoAccess(subscription.githubId)) {
            context.log.debug({
              subscription: {
                channelId: subscription.channelId,
                creatorId: subscription.creatorId,
                githubId: subscription.githubId,
                workspaceId: subscription.SlackWorkspace.slackId,
              },
            }, 'User lost access to resource. Deleting subscription.');

            await Promise.all([
              // @todo: deactive this subscription instead of deleting the db record
              await subscription.destroy(),
              await slack.chat.postMessage({
                channel: subscription.channelId,
                ...new ReEnableSubscription(context.payload.repository, creator.slackId).toJSON(),
              }),
            ]);
            return;
          }

          return callback(context, subscription, slack);
        }));
      }
    };
  };
};
