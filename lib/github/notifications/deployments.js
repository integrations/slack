const cache = require('../../cache');
const { DeploymentStatus } = require('./../../slack/renderer/deployment-status');

async function deploymentStatus(context, subscription, slack) {
  const deploymentStatusMessage = new DeploymentStatus({
    deploymentStatus: context.payload.deployment_status,
    deployment: context.payload.deployment,
    repository: context.payload.repository,
  });

  const { id } = context.payload.deployment;

  const storedMetaData = await cache.get(`deployment-${id}`);

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
    await cache.set(`deployment-${id}`, messageMetaData);
  }
}

module.exports = {
  deploymentStatus,
};
