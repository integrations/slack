const cache = require('../cache');
const { DeploymentStatus } = require('../messages/deployment-status');

async function trackDeployment(context) {
  const { ref, sha } = context.payload.deployment;
  const hasCustomRef = ref && ref !== sha;
  context.log({ hasCustomRef, ref, sha }, 'Processing deployment status');
}

async function deploymentStatus(context, subscription, slack) {
  trackDeployment(context);

  const deploymentStatusMessage = new DeploymentStatus({
    deploymentStatus: context.payload.deployment_status,
    deployment: context.payload.deployment,
    repository: context.payload.repository,
  });

  const cacheKey = subscription.cacheKey(`deployment#${context.payload.deployment.id}`);
  const storedMetaData = await cache.get(cacheKey);

  if (storedMetaData) {
    const { ts, channel } = storedMetaData;
    const res = await slack.chat.update({
      ts,
      channel,
      ...deploymentStatusMessage.toJSON(),
    });
    context.log(res, 'Updated Slack message');
  } else {
    const res = await slack.chat.postMessage({
      channel: subscription.channelId,
      ...deploymentStatusMessage.toJSON(),
    });
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
