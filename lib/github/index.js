const installations = require('./installations');

const {
  matchMetaDataStatetoIssueMessage,
  issueEvent,
} = require('./notifications/issues');


const {
  pullRequestEvent,
  onStatus,
  storePRMapping,
} = require('./notifications/pullRequests');

const {
  deploymentStatus,
} = require('./notifications/deployments');

const {
  push,
} = require('./notifications/push');

const oauth = require('./oauth');

module.exports = (robot) => {
  // Track installations
  installations(robot);

  // set up GitHub oauth
  oauth(robot);

  // Temporary "middleware" hack to look up routing before delivering event
  function route(callback) {
    const { Subscription } = robot.models;
    return async (context) => {
      // FIXME: we should be able to route all messages, even if there isn't a repo
      if (context.payload.repository) {
        const channels = await Subscription.lookup(context.payload.repository.id);
        context.log.debug({ channels }, 'Delivering to subscribed channels');

        return Promise.all(channels.map(channel => callback(context, channel)));
      }
    };
  }

  robot.on(['issues.opened', 'issues.closed', 'issues.reopened'], route(issueEvent));

  robot.on([
    'issues.labeled',
    'issues.unlabeled',
    'issues.assigned',
    'issues.unassigned',
    'issue_comment',
  ], matchMetaDataStatetoIssueMessage);

  robot.on(['pull_request.opened', 'pull_request.closed', 'pull_request.reopened'], route(pullRequestEvent));
  robot.on(['pull_request.opened', 'pull_request.synchronize'], storePRMapping);
  robot.on('status', onStatus);
  robot.on('deployment_status', route(deploymentStatus));
  robot.on('push', route(push));
};
