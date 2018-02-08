const installations = require('./installations');
const router = require('./router');

const {
  matchMetaDataStatetoIssueMessage,
  issueEvent,
} = require('./notifications/issues');


const {
  pullRequestEvent,
  onStatus,
  storePRMapping,
} = require('./notifications/pullRequests');

const { deploymentStatus } = require('./notifications/deployments');
const { push } = require('./notifications/push');
const { publicEvent } = require('./notifications/public');
const comments = require('./notifications/comments');

const oauth = require('./oauth');

// FIXME: move to module along with router
function deliver(callback) {
  return async (context, subscription, slack) => {
    const message = await callback(context, subscription);
    const res = await slack.chat.postMessage(subscription.channelId, '', message);
    context.log(res, 'Posted Slack message');
  };
}

module.exports = (robot) => {
  // Track installations
  installations(robot);

  // set up GitHub oauth
  oauth(robot);

  const route = router(robot);

  robot.on(['issues.opened', 'issues.closed', 'issues.reopened'], route(issueEvent));

  robot.on([
    'issues.labeled',
    'issues.unlabeled',
    'issues.assigned',
    'issues.unassigned',
    'issue_comment',
  ], route(matchMetaDataStatetoIssueMessage));

  robot.on(['pull_request.opened', 'pull_request.closed', 'pull_request.reopened'], route(pullRequestEvent));
  robot.on(['pull_request.opened', 'pull_request.synchronize'], storePRMapping);
  robot.on('status', route(onStatus));
  robot.on('deployment_status', route(deploymentStatus));
  robot.on('push', route(push));
  robot.on('public', route(publicEvent));

  robot.on('issue_comment', route(deliver(comments)));
};
