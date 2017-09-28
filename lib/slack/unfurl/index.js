// Roadmap: What do we want to unfurl?
// Phase 1: Issues, Pull Requests, Repositories, Profiles, Organizations, App
// Phase 2: Repository contents (files), Projects, Gists

// likely need different regular expressions based on what we're trying to parse

const githubUrl = require('../../github-url');
const unfurlComment = require('./comment');
const unfurlBlob = require('./blob');
const unfurlAccount = require('./account');
const unfurlIssue = require('./issue');
const unfurlPull = require('./pull');
const unfurlRepo = require('./repo');

module.exports = async (github, url) => {
  const params = githubUrl(url);

  if (params.type === 'comment') {
    const { owner, repo, number, id } = params;
    const issue = await github.issues.get({ owner, repo, number });
    const comment = await github.issues.getComment({ owner, repo, id });
    return unfurlComment(comment.data, issue.data);
  } else if (params.type === 'blob') {
    const { owner, repo, ref, path } = params;
    const blob = await github.repos.getContent({ owner, repo, path, ref });
    return unfurlBlob(blob.data, params);
  } else if (params.type === 'issue') {
    const { owner, repo, number } = params;
    const issue = await github.issues.get({ owner, repo, number });
    return unfurlIssue(issue.data);
  } else if (params.type === 'pull') {
    const { owner, repo, number } = params;
    const pull = await github.pullRequests.get({ owner, repo, number });
    return unfurlPull(pull.data, params);
  } else if (params.type === 'account') {
    const { owner } = params;
    const user = await github.users.getForUser({ username: owner });
    return unfurlAccount(user.data);
  } else if (params.type === 'repo') {
    const { owner, repo } = params;
    const repository = await github.repos.get({ owner, repo });
    return unfurlRepo(repository.data);
  }
};
