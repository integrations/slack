const { Message } = require('.');
const { Status } = require('./status');

class DeploymentStatus extends Message {
  constructor({ deployment, deploymentStatus, repository }) {
    super({
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

    const { ref, sha } = deployment;
    this.shortSha = sha.substr(0, 7);
    this.prettyRef = ref && ref !== sha ? `${ref} (${this.shortSha})` : this.shortSha;
    this.commitLink = `${this.repository.html_url}/commit/${this.deployment.sha}`;
  }

  getCore() {
    let center = `${this.prettyRef}`;

    let centerWithLink = `<${this.commitLink}|\`${this.prettyRef}\`>`;
    if (this.deployment.environment) {
      center += ` to ${this.deployment.environment}`;
      centerWithLink += this.deploymentStatus.target_url
        ? ` to <${this.deploymentStatus.target_url}|${this.deployment.environment}>`
        : ` to ${this.deployment.environment}`;
    }
    if (this.deploymentStatus.state === 'pending') {
      return {
        fallback: `[${this.repository.full_name}] Deploying ${center}`,
        text: `Deploying ${centerWithLink}`,
      };
    } else if (this.deploymentStatus.state === 'in_progress') {
      return {
        fallback: `[${this.repository.full_name}] Deployment in progress for ${center}`,
        text: `Deployment in progress ${centerWithLink}`,
      };
    } else if (this.deploymentStatus.state === 'queued') {
      return {
        fallback: `[${this.repository.full_name}] Deployment queued for ${center}`,
        text: `Deployment queued ${centerWithLink}`,
      };
    } else if (this.deploymentStatus.state === 'success') {
      return {
        fallback: `[${this.repository.full_name}] Successfully deployed ${center}`,
        text: `Successfully deployed ${centerWithLink}`,
      };
    } else if (this.deploymentStatus.state === 'error') {
      return {
        fallback: `[${this.repository.full_name}] Error when deploying ${center}`,
        text: `Error when deploying ${centerWithLink}`,
      };
    } else if (this.deploymentStatus.state === 'failure') {
      return {
        fallback: `[${this.repository.full_name}] Deploying ${center} failed`,
        text: `Deploying ${centerWithLink} failed`,
      };
    }
  }

  toJSON() {
    return {
      attachments: [
        {
          ...super.getBaseMessage(),
          color: Status.getStatusColor(this.deploymentStatus.state),
          ...this.getCore(),
          mrkdwn_in: ['text'],
        },
      ],
    };
  }
}

module.exports = {
  DeploymentStatus,
};
