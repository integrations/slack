const { Subscription, SlackUser, GitHubUser } = require('../models');
const { ReEnableSubscription } = require('../messages/flow');
const avoidReplicationLag = require('../github/avoid-replication-lag');
const isPermanentError = require('../slack/is-permanent-error');
const cache = require('../cache');

// Temporary "middleware" hack to look up routing before delivering event
module.exports = function route(callback) {
  return async (context) => {
    if (context.payload.repository) {
      const repoSubscriptions = await Subscription.lookup(context.payload.repository.id);
      const orgSubscriptions = context.payload.organization
        ? await Subscription.lookup(context.payload.organization.id)
        : [];
      const isRepoSubscription = repoSubscriptions.length > 0;
      const subscriptions = [
        ...repoSubscriptions,
        ...orgSubscriptions,
      ];

      context.log.debug({ subscriptions }, 'Delivering to subscribed channels');

      return Promise.all(subscriptions.map(async (subscription) => {
        if (!subscription.isEnabledForGitHubEvent(context.event)) {
          return;
        }

        const eventType = `${context.event}.${context.payload.action}`;

        // Create clack client with workspace token
        const slack = subscription.SlackWorkspace.client;

        if (subscription.creatorId && eventType !== 'repository.deleted') {
          // Verify that subscription creator still has access to the resource
          const creator = await SlackUser.findById(subscription.creatorId, {
            include: [GitHubUser],
          });

          const hasAccess = await cache.fetch(
            subscription.cacheKey('creator-access'),
            () => (isRepoSubscription
              ? creator.GitHubUser.hasRepoAccess(subscription.githubId)
              : creator.GitHubUser.hasOrgAccess(context.payload.organization.id))
            ,
            10 * 60 * 1000,
          );

          if (!hasAccess) {
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
        }

        // Delay GitHub API calls to avoid replication lag
        context.github.hook.before('request', avoidReplicationLag());

        try {
          await callback(context, subscription, slack);
        } catch (err) {
          if (isPermanentError(err)) {
            context.log.info({ err }, 'Permanent error from Slack. Removing subscription');
            await subscription.destroy();
          } else {
            throw err;
          }
        }
      }));
    }
  };
};
