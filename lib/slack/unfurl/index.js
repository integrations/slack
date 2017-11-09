// Roadmap: What do we want to unfurl?
// Phase 1: Issues, Pull Requests, Repositories, Profiles, Organizations, App
// Phase 2: Repository contents (files), Projects, Gists

// likely need different regular expressions based on what we're trying to parse

const githubUrl = require('../../github-url');
const unfurlIssue = require('./issue');
const unfurlPull = require('./pull');

const { Repository } = require('../renderer/repository');
const { Account } = require('../renderer/account');
const { Comment } = require('../renderer/comment');
const { Blob } = require('../renderer/blob');

module.exports = async (github, url) => {
  const params = githubUrl(url);

  if (params.type === 'comment') {
    const { owner, repo, number, id } = params;
    const issue = (await github.issues.get({ owner, repo, number })).data;
    const comment = (await github.issues.getComment({ owner, repo, id })).data;
    const commentMessage = new Comment({ comment, issue });
    return commentMessage.getRenderedMessage();
  } else if (params.type === 'blob') {
    const { owner, repo, ref, path } = params;
    const blob = (await github.repos.getContent({ owner, repo, path, ref })).data;
    const blobMessage = new Blob({ blob, line: params.line });
    return blobMessage.getRenderedMessage();
  } else if (params.type === 'issue') {
    const { owner, repo, number } = params;
    const issue = await github.issues.get({ owner, repo, number });
    return unfurlIssue(issue.data, params);
  } else if (params.type === 'pull') {
    const { owner, repo, number } = params;
    const pull = await github.pullRequests.get({ owner, repo, number });
    const issue = await github.issues.get({ owner, repo, number });
    return unfurlPull(pull.data, issue.data, params);
  } else if (params.type === 'account') {
    const { owner } = params;
    const account = (await github.users.getForUser({ username: owner })).data;
    const accountMessage = new Account({ account });
    return accountMessage.getRenderedMessage();
  } else if (params.type === 'repo') {
    const { owner, repo } = params;
    const repository = await github.repos.get({ owner, repo });
    const repositoryMessage = new Repository({ repository: repository.data });
    return repositoryMessage.getRenderedMessage();
  }
};
