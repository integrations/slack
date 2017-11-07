const {
  matchMetaDataStatetoIssueMessage,
  issueEvent,
} = require('./notifications/issues');


const {
  pullRequestEvent,
  onStatus,
  storePRMapping,
} = require('./notifications/pullRequests');


module.exports = (robot) => {
  robot.on(['issues.opened', 'issues.closed', 'issues.reopened'], issueEvent);

  robot.on([
    'issues.labeled',
    'issues.unlabeled',
    'issues.assigned',
    'issues.unassigned',
    'issue_comment',
  ], matchMetaDataStatetoIssueMessage);

  robot.on(['pull_request.opened', 'pull_request.closed', 'pull_request.reopened'], pullRequestEvent);
  robot.on(['pull_request.opened', 'pull_request.synchronize'], storePRMapping);
  robot.on('status', onStatus);
};
