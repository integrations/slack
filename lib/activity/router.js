const { Subscription, SlackUser, GitHubUser } = require('../models');
const { ReEnableSubscription } = require('../messages/flow');
const avoidReplicationLag = require('../github/avoid-replication-lag');
const isPermanentError = require('../slack/is-permanent-error');
const cache = require('../cache');
const logger = require('../logger');
const processor = require('./processor')(logger);
const { shouldFilterByLabel, shouldFilterByRequestedReviewers } = require('./filters');

// Temporary "middleware" hack to look up routing before delivering event
module.exports = function route(callback) {
  return async (context) => {
    if (context.payload.repository) {
      const query = [
        { githubId: context.payload.repository.id, type: 'repo' }, // for repository subscriptions
        { githubId: context.payload.repository.owner.id, type: 'account' }, // for account subscriptions
      ];
      const subscriptions = await Subscription.lookupAll(query);

      context.log.debug({ subscriptions }, 'Delivering to subscribed channels');

      const promise = Promise.all(subscriptions.map(async (subscription) => {
        if (!subscription.isEnabledForGitHubEvent(context.event)) {
          return;
        }

        const eventType = `${context.event}.${context.payload.action}`;

        if (eventType === 'repository.deleted' && subscription.type === 'account') {
          // Do not deliver repository.deleted events for org subscriptions
          return;
        }

        // Create clack client with workspace token
        const slack = subscription.SlackWorkspace.client;

        if (subscription.creatorId && eventType !== 'repository.deleted') {
          // Verify that subscription creator still has access to the resource
          const creator = await SlackUser.findById(subscription.creatorId, {
            include: [GitHubUser],
          });

          const cacheKey = `creator-access#${creator.GitHubUser.id}:${context.payload.repository.id}`;
          const hasRepoAccess = await cache.fetch(
            cacheKey,
            () => creator.GitHubUser.hasRepoAccess(context.payload.repository.id),
            10 * 60 * 1000,
          );

          if (!hasRepoAccess) {
            if (subscription.type === 'account') {
              // It is fine to subscribe to an account and not have access to all repos.
              // We just ignore the events for repos the user doesn't have access to.
              return;
            }
            context.log.debug({
              subscription: {
                channelId: subscription.channelId,
                creatorId: subscription.creatorId,
                githubId: subscription.githubId,
                githubName: subscription.githubName,
                workspaceId: subscription.SlackWorkspace.slackId,
              },
            }, 'User lost access to resource. Deleting subscription.');

            await Promise.all([
              await subscription.destroyWithReason('subscription creator lost access'),
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

        // Label filtering
        const issue = context.payload.issue || context.payload.pull_request;
        if (shouldFilterByLabel(subscription, issue)) {
          const labelNames = issue.labels.map(label => label.name);
          const whitelist = subscription.settings.required_labels;

          if (!labelNames.some(l => whitelist.includes(l))) {
            context.log({ labelNames, whitelist, eventType }, 'Discarding event. Required labels not found.');
            return;
          }
        }

        // RequestedReviewers filtering
        if (shouldFilterByRequestedReviewers(subscription, issue)) {
          const reviewerNames = issue.requested_reviewers.map(reviewer => reviewer.name);
          const teamNames = issue.requested_teams.map(team => team.name);
          const names = reviewerNames + teamNames;
          const whitelist = subscription.settings.required_reviewers;

          if (!names.some(l => whitelist.includes(l))) {
            context.log({ names, whitelist, eventType }, 'Discarding event. Required reviewers not found.');
            return;
          }
        }

        const githubName =
          subscription.type === 'account'
            ? context.payload.repository.owner.login
            : context.payload.repository.full_name;
        await subscription.updateGithubName(githubName);

        try {
          await callback(context, subscription, slack);
        } catch (err) {
          if (isPermanentError(err)) {
            const { repository } = context.payload;
            const info = {
              err, subscription, eventType, repo: repository.full_name,
            };
            context.log.warn(info, 'Permanent error from Slack. Removing subscription');
            await subscription.destroyWithReason(err.message || 'permanent error');
          } else {
            throw err;
          }
        }
      }));

      return processor(promise);
    }
  };
};
