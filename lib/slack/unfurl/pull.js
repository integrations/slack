const { PullRequest } = require('../../slack/renderer');

module.exports = function unfurlPull(pull, issue, params) {
  const repository = {
    full_name: `${params.owner}/${params.repo}`,
  };

  const prMessage = new PullRequest(
    { ...pull, labels: issue.labels },
    repository,
    'issues.opened',
    true,
    null,
  );
  return prMessage.getRenderedMessage();
};
