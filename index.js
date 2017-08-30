const {
  matchMetaDataStatetoIssueMessage,
  issueOpened,
  issueClosed,
  issueReopened,
} = require('./lib/issues');

const oauth = require('./lib/oauth');

module.exports = (robot) => {
  oauth(robot);

  robot.on('issues.opened', issueOpened);

  robot.on('issues.labeled', matchMetaDataStatetoIssueMessage);
  robot.on('issues.unlabeled', matchMetaDataStatetoIssueMessage);
  robot.on('issues.assigned', matchMetaDataStatetoIssueMessage);
  robot.on('issues.unassigned', matchMetaDataStatetoIssueMessage);
  robot.on('issue_comment', matchMetaDataStatetoIssueMessage);

  robot.on('issues.closed', issueClosed);

  robot.on('issues.reopened', issueReopened);
};
