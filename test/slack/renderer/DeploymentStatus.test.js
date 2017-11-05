const { DeploymentStatus } = require('../../../lib/slack/renderer/deployment-status');
const deploymentStatusPendingFixture = require('../../fixtures/webhooks/deployment/status_pending.json');
const deploymentStatusSuccessFixture = require('../../fixtures/webhooks/deployment/status_success.json');

describe('Deployment status rendering', () => {
  test('works for pending status', async () => {
    const deploymentStatusMessage = new DeploymentStatus({
      deploymentStatus: deploymentStatusPendingFixture.deployment_status,
      deployment: deploymentStatusPendingFixture.deployment,
      repository: deploymentStatusPendingFixture.repository,
    });
    expect(deploymentStatusMessage.getRenderedMessage()).toMatchSnapshot();
  });

  test('works for success status', async () => {
    const deploymentStatusMessage = new DeploymentStatus({
      deploymentStatus: deploymentStatusSuccessFixture.deployment_status,
      deployment: deploymentStatusSuccessFixture.deployment,
      repository: deploymentStatusSuccessFixture.repository,
    });
    expect(deploymentStatusMessage.getRenderedMessage()).toMatchSnapshot();
  });
});
