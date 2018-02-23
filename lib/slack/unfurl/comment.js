const { Comment } = require('../../messages/comment');

module.exports = async (params, github, unfurlType) => {
  const {
    owner, repo, number, id,
  } = params;
  const issue = (await github.issues.get({ owner, repo, number })).data;
  const comment = (await github.issues.getComment({
    owner,
    repo,
    id,
    headers: { accept: 'application/vnd.github.html+json' },
  })).data;
  const repository = (await github.repos.get({ owner, repo })).data;
  const commentMessage = new Comment({
    comment, issue, repository, unfurlType,
  });
  return commentMessage.getRenderedMessage();
};
