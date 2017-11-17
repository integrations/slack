// Roadmap: What do we want to unfurl?
// Phase 1: Issues, Pull Requests, Repositories, Profiles, Organizations, App
// Phase 2: Repository contents (files), Projects, Gists

// likely need different regular expressions based on what we're trying to parse

const githubUrl = require('../../github-url');

const { Repository } = require('../renderer/repository');
const { Account } = require('../renderer/account');
const { Comment } = require('../renderer/comment');
const { Blob } = require('../renderer/blob');
const { Issue } = require('../../slack/renderer/issue');
const { PullRequest } = require('../../slack/renderer/pull-request');

// eslint-disable-next-line no-unused-vars
module.exports = async (github, url, unfurlType) => {
  const params = githubUrl(url);


  if (params.type === 'comment') {
    const { owner, repo, number, id } = params;
    const issue = (await github.issues.get({ owner, repo, number })).data;
    const comment = (await github.issues.getComment({ owner, repo, id })).data;
    const repository = (await github.repos.get({ owner, repo })).data;
    const commentMessage = new Comment({ comment, issue, repository, unfurlType });
    return commentMessage.getRenderedMessage();
  } else if (params.type === 'blob') {
    const { owner, repo, ref, path, line } = params;
    const blob = (await github.repos.getContent({ owner, repo, path, ref })).data;
    const repository = (await github.repos.get({ owner, repo })).data;
    const blobMessage = new Blob({ blob, line, repository, unfurlType });
    return blobMessage.getRenderedMessage();
  } else if (params.type === 'issue') {
    const { owner, repo, number } = params;
    const issue = (await github.issues.get({ owner, repo, number })).data;
    const repository = (await github.repos.get({ owner, repo })).data;
    const issueMessage = new Issue({ issue, repository, unfurl: true });
    return issueMessage.getMainAttachment();
  } else if (params.type === 'pull') {
    const { owner, repo, number } = params;
    const pull = (await github.pullRequests.get({ owner, repo, number })).data;
    const repository = (await github.repos.get({ owner, repo })).data;
    pull.labels = (await github.issues.get({ owner, repo, number })).data.labels;
    const prMessage = new PullRequest({ pullRequest: pull, repository, unfurl: true });
    return prMessage.getRenderedMessage();
  } else if (params.type === 'account') {
    const { owner } = params;
    const account = (await github.users.getForUser({ username: owner })).data;
    const accountMessage = new Account({ account, unfurlType });
    return accountMessage.getRenderedMessage();
  } else if (params.type === 'repo') {
    const { owner, repo } = params;
    const repository = await github.repos.get({ owner, repo });
    const repositoryMessage = new Repository({ repository: repository.data, unfurlType });
    return repositoryMessage.getRenderedMessage();
  }
};
