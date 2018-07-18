const { DeploymentStatus } = require('../messages/deployment-status');

async function deploymentStatus(context, subscription, channel) {
  return channel.rollup(new DeploymentStatus({
    deploymentStatus: context.payload.deployment_status,
    deployment: context.payload.deployment,
    repository: context.payload.repository,
  }));
}

module.exports = {
  deploymentStatus,
};
