const { Message, constants } = require('.');

// See https://developer.github.com/v4/enum/deploymentstate/
const colorsByState = {
  ABANDONED: constants.GITHUB_BLACK,
  ACTIVE: constants.OPEN_GREEN,
  DESTROYED: constants.CLOSED_RED,
  ERROR: constants.STATUS_FAILURE,
  FAILURE: constants.STATUS_FAILURE,
  INACTIVE: constants.GITHUB_BLACK,
  PENDING: constants.STATUS_PENDING,
};

const attachmentForDeployment = (deployment) => {
  const {
    state,
    latestStatus,
    creator,
    ref,
    task,
    environment,
    commit,
  } = deployment;
  const { login } = creator;
  const attachment = {
    fallback: `${login} triggered a ${task} on ${environment} from ${ref.name}`,
    color: colorsByState[state],
    pretext: deployment.description || undefined,
    author_name: creator.login,
    author_link: creator.url,
    author_icon: creator.avatarUrl,
    title: `${ref.name} ${commit.message}`,
    title_link: commit.commitUrl,
    fields: [
      {
        title: 'Task',
        value: task,
        short: true,
      },
      {
        title: 'Environment',
        value: environment,
        short: true,
      },
      {
        title: 'State',
        value: state,
        short: true,
      },
    ],
    footer: 'Created',
    footer_icon: constants.FOOTER_ICON,
    ts: new Date(deployment.createdAt).getTime() / 1000,
  };
  if (latestStatus) {
    attachment.fields.push({
      title: 'Latest Status',
      value: `${latestStatus.state} ${latestStatus.description}`,
      short: true,
    });
  }
  return attachment;
};

module.exports = class DeploymentList extends Message {
  constructor(deployments, resource) {
    super({});
    this.deployments = deployments;
    this.resource = resource;
  }

  toJSON() {
    if (this.deployments.length === 0) {
      return {
        text: `No deployments found for \`${this.resource.owner}/${this.resource.repo}\``,
      };
    }
    return {
      attachments: this.deployments.map(attachmentForDeployment),
    };
  }
};
