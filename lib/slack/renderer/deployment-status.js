const { Message } = require('../../slack/renderer');
const { Status } = require('../../slack/renderer/status');

class DeploymentStatus extends Message {
  constructor({ deployment, deploymentStatus, repository }) {
    super({
      includeAuthor: true,
      author: {
        login: deployment.creator.login,
        avatarURL: deployment.creator.avatar_url,
        htmlURL: deployment.creator.html_url,
      },
      footer: `<${repository.html_url}|${repository.full_name}>`,

    });
    this.deploymentStatus = deploymentStatus;
    this.deployment = deployment;
    this.repository = repository;
    this.shortSha = this.deployment.sha.substr(0, 7);
    this.commitLink = `${this.repository.html_url}/commit/${this.deployment.sha}`;
  }

  getCore() {
    // @todo show ref instead of sha if one exists
    let center = `${this.shortSha}`;
    let centerWithLink = `<${this.commitLink}|\`${this.shortSha}\`>`;
    if (this.deployment.environment) {
      center += ` to ${this.deployment.environment}`;
      centerWithLink += ` to <${this.deploymentStatus.target_url}|${this.deployment.environment}>`;
    }
    if (this.deploymentStatus.state === 'pending') {
      return {
        fallback: `Deploying ${center}`,
        text: `Deploying ${centerWithLink}`,
      };
    } else if (this.deploymentStatus.state === 'success') {
      return {
        fallback: `Successfully deployed ${center}`,
        text: `Successfully deployed ${centerWithLink}`,
      };
    } else if (this.deploymentStatus.state === 'error') {
      return {
        fallback: `Error when deploying ${center}`,
        text: `Error when deploying ${centerWithLink}`,
      };
    } else if (this.deploymentStatus.state === 'failure') {
      return {
        fallback: `Deploying ${center} failed`,
        text: `Deploying ${centerWithLink} failed`,
      };
    }
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      color: Status.getStatusColor(this.deploymentStatus.state),
      ...this.getCore(),
      mrkdwn_in: ['text'],
    };
  }
  getRenderedMessage() {
    return {
      attachments: [
        this.getAttachment(),
      ],
    };
  }
}

module.exports = {
  DeploymentStatus,
};
