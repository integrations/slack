const { Issue } = require('../../slack/renderer/issue');

module.exports = async (params, github, unfurlType) => {
  const { owner, repo, number } = params;
  const issue = (await github.issues.get({
    owner,
    repo,
    number,
    headers: { accept: 'application/vnd.github.html+json' } })).data;
  const repository = (await github.repos.get({ owner, repo })).data;
  const issueMessage = new Issue({ issue, repository, unfurlType });
  return issueMessage.getMainAttachment();
};
