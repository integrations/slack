const { Message } = require('../../slack/renderer');
const { Status } = require('../../slack/renderer/status');

class DeploymentStatus extends Message {
  constructor(constructorObject) {
    super({
      includeFooter: false, // no GitHub link to link to
      includeAuthor: true,
      author: {
        login: constructorObject.deployment.creator.login,
        avatarURL: constructorObject.deployment.creator.avatar_url,
        htmlURL: constructorObject.deployment.creator.html_url,
      },
    });
    this.deploymentStatus = constructorObject.deploymentStatus;
    this.deployment = constructorObject.deployment;
    this.repository = constructorObject.repository;
    this.branches = constructorObject.branches;
    this.shortSha = this.deployment.sha.substr(0, 7);
    this.commitLink = `${this.repository.html_url}/commit/${this.deployment.sha}`;
  }

  getBranchName() {
    let branchName;
    // eslint-disable-next-line no-restricted-syntax
    for (const branch of this.branches) {
      if (branch.commit.sha === this.deployment.sha) {
        // prefer default branch
        if (branch.name === this.repository.default_branch) {
          branchName = branch.name;
          break;
        }
        branchName = branch.name;
      }
    }
    return branchName;
  }

  getCore() {
    let center = this.shortSha;
    if (this.getBranchName()) {
      center = this.getBranchName();
    }
    let centerWithLink = `<${this.commitLink}|\`${center}\`>`;
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
