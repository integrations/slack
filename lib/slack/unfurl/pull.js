const { PullRequest } = require('../../slack/renderer/PullRequest');

module.exports = function unfurlPull(pull, issue, params) {
  const repository = {
    full_name: `${params.owner}/${params.repo}`,
  };

  const prMessage = new PullRequest({
    pullRequest: { ...pull, labels: issue.labels },
    repository,
    unfurl: true,
  });
  return prMessage.getRenderedMessage();
};
