const { DeploymentStatus } = require('../../lib/messages/deployment-status');
const deploymentStatusPendingFixture = require('../fixtures/webhooks/deployment/status_pending.json');
const deploymentStatusSuccessFixture = require('../fixtures/webhooks/deployment/status_success.json');

describe('Deployment status rendering', () => {
  test('works for pending status', () => {
    const deploymentStatusMessage = new DeploymentStatus({
      deploymentStatus: deploymentStatusPendingFixture.deployment_status,
      deployment: deploymentStatusPendingFixture.deployment,
      repository: deploymentStatusPendingFixture.repository,
    });
    expect(deploymentStatusMessage.toJSON()).toMatchSnapshot();
  });

  test('works for success status', () => {
    const deploymentStatusMessage = new DeploymentStatus({
      deploymentStatus: deploymentStatusSuccessFixture.deployment_status,
      deployment: deploymentStatusSuccessFixture.deployment,
      repository: deploymentStatusSuccessFixture.repository,
    });
    expect(deploymentStatusMessage.toJSON()).toMatchSnapshot();
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
    expect(deploymentStatusMessage.toJSON()).toMatchSnapshot();
  });
  test('works for in_progress status', () => {
    const deploymentStatus = {
      ...deploymentStatusSuccessFixture.deployment_status,
      state: 'in_progress',
    };
    const deploymentStatusMessage = new DeploymentStatus({
      deploymentStatus,
      deployment: deploymentStatusSuccessFixture.deployment,
      repository: deploymentStatusSuccessFixture.repository,
    });
    expect(deploymentStatusMessage.toJSON()).toMatchSnapshot();
  });
  test('works for queued status', () => {
    const deploymentStatus = {
      ...deploymentStatusSuccessFixture.deployment_status,
      state: 'queued',
    };
    const deploymentStatusMessage = new DeploymentStatus({
      deploymentStatus,
      deployment: deploymentStatusSuccessFixture.deployment,
      repository: deploymentStatusSuccessFixture.repository,
    });
    expect(deploymentStatusMessage.toJSON()).toMatchSnapshot();
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
    expect(deploymentStatusMessage.toJSON()).toMatchSnapshot();
  });
  test('works for statuses without a target URL', () => {
    const deploymentStatus = {
      ...deploymentStatusSuccessFixture.deployment_status,
      target_url: undefined,
    };
    const deploymentStatusMessage = new DeploymentStatus({
      deploymentStatus,
      deployment: deploymentStatusSuccessFixture.deployment,
      repository: deploymentStatusSuccessFixture.repository,
    });
    expect(deploymentStatusMessage.toJSON()).toMatchSnapshot();
  });
  test('uses ref and the short sha, when ref differs from the sha', () => {
    const deployment = {
      ...deploymentStatusSuccessFixture.deployment,
      ref: 'master',
    };
    const deploymentStatusMessage = new DeploymentStatus({
      deploymentStatus: deploymentStatusSuccessFixture.deployment_status,
      deployment,
      repository: deploymentStatusSuccessFixture.repository,
    });

    const message = deploymentStatusMessage.toJSON().attachments[0].text;
    expect(message).toMatch(/successfully deployed.*master.*\(3dce5c8\)/i);
    expect(deploymentStatusMessage.toJSON()).toMatchSnapshot();
  });
  test('uses short sha if ref is unequal but null', () => {
    const deployment = {
      ...deploymentStatusSuccessFixture.deployment,
      ref: null,
    };
    const deploymentStatusMessage = new DeploymentStatus({
      deploymentStatus: deploymentStatusSuccessFixture.deployment_status,
      deployment,
      repository: deploymentStatusSuccessFixture.repository,
    });

    const message = deploymentStatusMessage.toJSON().attachments[0].text;
    expect(message).toMatch(/successfully deployed.*3dce5c8.*/i);
    expect(deploymentStatusMessage.toJSON()).toMatchSnapshot();
  });
});
