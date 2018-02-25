const { PullRequest } = require('../messages/pull-request');

module.exports = async (params, github, unfurlType) => {
  const { owner, repo, number } = params;
  const pull = (await github.pullRequests.get({
    owner,
    repo,
    number,
    headers: { accept: 'application/vnd.github.html+json' },
  })).data;
  const repository = (await github.repos.get({ owner, repo })).data;
  pull.labels = (await github.issues.get({ owner, repo, number })).data.labels;
  const prMessage = new PullRequest({ pullRequest: pull, repository, unfurlType });
  return prMessage.getRenderedMessage();
};
