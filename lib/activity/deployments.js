const cache = require('../cache');
const { DeploymentStatus } = require('../messages/deployment-status');

async function deploymentStatus(context, subscription, slack) {
  const deploymentStatusMessage = new DeploymentStatus({
    deploymentStatus: context.payload.deployment_status,
    deployment: context.payload.deployment,
    repository: context.payload.repository,
  });

  const cacheKey = subscription.cacheKey(`deployment#${context.payload.deployment.id}`);
  const storedMetaData = await cache.get(cacheKey);

  if (storedMetaData) {
    const res = await slack.chat.update(storedMetaData.ts, storedMetaData.channel, '', deploymentStatusMessage.toJSON());
    context.log(res, 'Updated Slack message');
  } else {
    const res = await slack.chat.postMessage(subscription.channelId, '', deploymentStatusMessage.toJSON());
    context.log(res, 'Posted Slack message');
    const messageMetaData = {
      channel: res.channel,
      ts: res.ts,
    };
    await cache.set(cacheKey, messageMetaData);
  }
}

module.exports = {
  deploymentStatus,
};
