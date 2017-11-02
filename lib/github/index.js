const {
  matchMetaDataStatetoIssueMessage,
  issueOpened,
  issueClosed,
  issueReopened,
} = require('./notifications/issues');


const {
  pullRequestEvent,
  onStatus,
  storePRMapping,
} = require('./notifications/pullRequests');


module.exports = (robot) => {
  robot.on('issues.opened', issueOpened);

  robot.on([
    'issues.labeled',
    'issues.unlabeled',
    'issues.assigned',
    'issues.unassigned',
    'issue_comment',
  ], matchMetaDataStatetoIssueMessage);

  robot.on('issues.closed', issueClosed);
  robot.on('issues.reopened', issueReopened);
  robot.on(['pull_request.opened', 'pull_request.closed'], pullRequestEvent);
  robot.on(['pull_request.opened', 'pull_request.synchronize'], storePRMapping);
  robot.on('status', onStatus);
};
