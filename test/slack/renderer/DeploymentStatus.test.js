const { DeploymentStatus } = require('../../../lib/slack/renderer/deployment-status');
const deploymentStatusPendingFixture = require('../../fixtures/webhooks/deployment/status_pending.json');
const deploymentStatusSuccessFixture = require('../../fixtures/webhooks/deployment/status_success.json');

describe('Deployment status rendering', () => {
  describe('(attachment)', () => {
    test('works for pending status', () => {
      const deploymentStatusMessage = new DeploymentStatus({
        deploymentStatus: deploymentStatusPendingFixture.deployment_status,
        deployment: deploymentStatusPendingFixture.deployment,
        repository: deploymentStatusPendingFixture.repository,
      });
      expect(deploymentStatusMessage.getAttachment()).toMatchSnapshot();
    });

    test('works for success status', () => {
      const deploymentStatusMessage = new DeploymentStatus({
        deploymentStatus: deploymentStatusSuccessFixture.deployment_status,
        deployment: deploymentStatusSuccessFixture.deployment,
        repository: deploymentStatusSuccessFixture.repository,
      });
      expect(deploymentStatusMessage.getAttachment()).toMatchSnapshot();
    });
    test('works for failure status', () => {
      const deploymentStatus = {
        ...deploymentStatusSuccessFixture.deployment_status,
        state: 'failure',
      };
      const deploymentStatusMessage = new DeploymentStatus({
        deploymentStatus,
        deployment: deploymentStatusSuccessFixture.deployment,
        repository: deploymentStatusSuccessFixture.repository,
      });
      expect(deploymentStatusMessage.getAttachment()).toMatchSnapshot();
    });
    test('works for error status', () => {
      const deploymentStatus = {
        ...deploymentStatusSuccessFixture.deployment_status,
        state: 'error',
      };
      const deploymentStatusMessage = new DeploymentStatus({
        deploymentStatus,
        deployment: deploymentStatusSuccessFixture.deployment,
        repository: deploymentStatusSuccessFixture.repository,
      });
      expect(deploymentStatusMessage.getAttachment()).toMatchSnapshot();
    });
  });
  describe('(full message)', () => {
    test('works', () => {
      const deploymentStatusMessage = new DeploymentStatus({
        deploymentStatus: deploymentStatusPendingFixture.deployment_status,
        deployment: deploymentStatusPendingFixture.deployment,
        repository: deploymentStatusPendingFixture.repository,
      });
      expect(deploymentStatusMessage.getRenderedMessage()).toMatchSnapshot();
    });
  });
});
