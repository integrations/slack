const {
  matchMetaDataStatetoIssueMessage,
  issueOpened,
  issueClosed,
  issueReopened,
} = require('./lib/issues');

const {
  pullRequestOpened,
  status,
} = require('./lib/pullRequests');

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

  robot.on('pull_request.opened', pullRequestOpened);
  robot.on('status', status);
};
