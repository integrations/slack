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
  let exists = true;
  let storedMetaData;
  try {
    storedMetaData = await get(`deployment-${id}`);
  } catch (error) {
    // new deployment status
    exists = false;
  }
  if (exists) {
    const res = await slack.web.chat.update(storedMetaData.ts, storedMetaData.channel, '', deploymentStatusMessage.getRenderedMessage());
    context.log(res, 'Updated Slack message');
  } else {
    const res = await slack.web.chat.postMessage(channel, '', deploymentStatusMessage.getRenderedMessage());
    context.log(res, 'Posted Slack message');
    const messageMetaData = {
      channel: res.channel,
      ts: res.ts,
    };
    set(`deployment-${id}`, messageMetaData);
  }
}

module.exports = {
  deploymentStatus,
};
