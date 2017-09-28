const setupSlack = require('./slack');

const {
  matchMetaDataStatetoIssueMessage,
  issueOpened,
  issueClosed,
  issueReopened,
} = require('./issues');

const {
  pullRequestOpened,
  onStatus,
  storePRMapping,
} = require('./pullRequests');

module.exports = (robot) => {
  setupSlack(robot);

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
  robot.on(['pull_request.opened', 'pull_request.synchronize'], storePRMapping);
  robot.on('status', onStatus);
};
