const slack = require('../../slack/client');
const { get, set } = require('./../../storage');
const { DeploymentStatus } = require('./../../slack/renderer/deployment-status');

async function deploymentStatus(context, channel) {
  const deploymentStatusMessage = new DeploymentStatus({
    deploymentStatus: context.payload.deployment_status,
    deployment: context.payload.deployment,
    repository: context.payload.repository,
  });

  const id = context.payload.deployment.id;

  const storedMetaData = await get(`deployment-${id}`);

  if (storedMetaData) {
    const res = await slack.web.chat.update(storedMetaData.ts, storedMetaData.channel, '', deploymentStatusMessage.getRenderedMessage());
    context.log(res, 'Updated Slack message');
  } else {
    const res = await slack.web.chat.postMessage(channel, '', deploymentStatusMessage.getRenderedMessage());
    context.log(res, 'Posted Slack message');
    const messageMetaData = {
      channel: res.channel,
      ts: res.ts,
    };
    await set(`deployment-${id}`, messageMetaData);
  }
}

module.exports = {
  deploymentStatus,
};
