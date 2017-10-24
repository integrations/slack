const { Issue } = require('../../slack/renderer');

module.exports = function unfurlIssue(issue, params) {
  const repository = {
    full_name: `${params.owner}/${params.repo}`,
  };
  const issueMessage = new Issue(
    issue,
    repository,
    null,
    true,
  );
  return issueMessage.getFullSlackMessageAttachment();
};
