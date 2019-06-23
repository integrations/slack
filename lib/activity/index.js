const route = require('./router');

const {
  matchMetaDataStatetoIssueMessage,
  issueEvent,
} = require('./issues');

const {
  pullRequestEvent,
  onStatus,
  storePRMapping,
} = require('./pull-requests');

const { deploymentStatus } = require('./deployments');
const { push } = require('./push');
const publicEvent = require('./public');
const comments = require('./comments');
const ref = require('./ref');
const review = require('./review');
const { repositoryDeleted } = require('./repository');

const { releaseEvent } = require('./releases');

module.exports = (robot) => {
  robot.on(['issues.opened', 'issues.closed', 'issues.reopened'], route(issueEvent));

  robot.on([
    'issues.labeled',
    'issues.unlabeled',
    'issues.assigned',
    'issues.unassigned',
    'issue_comment',
    'issues.edited',
  ], route(matchMetaDataStatetoIssueMessage));

  robot.on(['pull_request.opened', 'pull_request.closed', 'pull_request.reopened', 'pull_request.ready_for_review', 'pull_request.review_requested'], route(pullRequestEvent));
  robot.on(['pull_request.opened', 'pull_request.synchronize'], storePRMapping);
  robot.on('status', route(onStatus));
  robot.on('deployment_status', route(deploymentStatus));
  robot.on('push', route(push));
  robot.on('public', route(publicEvent));

  robot.on([
    'commit_comment.created',
    'issue_comment.created',
    'issue_comment.edited',
    'pull_request_review_comment.created',
    'pull_request_review_comment.edited',
  ], route(comments));

  robot.on(['create', 'delete'], route(ref));
  robot.on(['pull_request_review.submitted', 'pull_request_review.edited'], route(review));

  robot.on('repository.deleted', route(repositoryDeleted));

  robot.on('release', route(releaseEvent));
};
