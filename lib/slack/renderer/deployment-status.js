// show stand-alone deployment message when ~default branch~ a deploy is made to production
// attach it to pull request message when PR is deployed
// Only listen to `deployment_status` not `deployment`
// Not sure how to show `description`, because it could be anything. Need to look at a few examples

// @todo show ref instead of sha if one exists
// @todo check if there is a pull request with equivalent head sha, then integrate into that message
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
    this.shortSha = this.deployment.sha.substr(0, 7);
    this.commitLink = `${this.repository.html_url}/commit/${this.deployment.sha}`;
  }

  getCore() {
    if (this.deploymentStatus.state === 'pending') {
      return {
        fallback: `Deploying ${this.shortSha} to ${this.deployment.environment}`,
        text: `Deploying <${this.commitLink}|\`${this.shortSha}\`> to <${this.deploymentStatus.target_url}|${this.deployment.environment}>`,
      };
    } else if (this.deploymentStatus.state === 'success') {
      return {
        fallback: `Successfully deployed ${this.shortSha} to ${this.deployment.environment}`,
        text: `Successfully deployed <${this.commitLink}|\`${this.shortSha}\`> to <${this.deploymentStatus.target_url}|${this.deployment.environment}>`,
      };
    } else if (this.deploymentStatus.state === 'error') {
      return {
        fallback: `Error when deploying ${this.shortSha} to ${this.deployment.environment}`,
        text: `Error when deploying <${this.commitLink}|\`${this.shortSha}\`> to <${this.deploymentStatus.target_url}|${this.deployment.environment}>`,
      };
    } else if (this.deploymentStatus.state === 'failure') {
      return {
        fallback: `Deploying ${this.shortSha} to ${this.deployment.environment} failed`,
        text: `Deploying <${this.commitLink}|\`${this.shortSha}\`> to <${this.deploymentStatus.target_url}|${this.deployment.environment}> failed`,
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
