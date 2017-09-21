// Roadmap: What do we want to unfurl?
// Phase 1: Issues, Pull Requests, Repositories, Profiles, Organizations, App
// Phase 2: Repository contents (files), Projects, Gists

// likely need different regular expressions based on what we're trying to parse

const moment = require('moment');
const githubUrl = require('./github-url');
const unfurlComment = require('./unfurl/comment');
const unfurlBlob = require('./unfurl/blob');
const unfurlAccount = require('./unfurl/account');
const unfurlIssue = require('./unfurl/issue');

const {
  arrayToFormattedString,
  getHexColorbyState,
  getFormattedState,
} = require('./helpers');

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
    const pull = (await github.pullRequests.get({ owner, repo, number })).data;

    return {
      fallback: `${owner}/${repo}#${pull.number}: ${pull.title}`,
      color: getHexColorbyState(
          pull.state,
          pull.merged,
      ),
      author_name: pull.user.login,
      author_link: pull.user.html_url,
      author_icon: pull.user.avatar_url,
      title: `#${pull.number} ${pull.title}`,
      title_link: pull.html_url,
      text: pull.body, // We should truncate markdown that Slack doesn't understand.
      fields: [
        {
          title: 'State',
          value: getFormattedState(pull.state, pull.merged),
          short: true,
        },
        {
          title: 'Assignees',
          value: arrayToFormattedString(pull.assignees, 'login'),
          short: true,
        },
        {
          title: 'Comments',
          value: `<${pull.comments_url}|:speech_balloon: ${pull.comments}>`,
          short: true,
        },
      ],
      footer: `<${pull.html_url}|View it on GitHub>`,
      footer_icon: 'https://assets-cdn.github.com/favicon.ico',
      ts: moment(pull.created_at).unix(),
      mrkdwn_in: ['pretext', 'text', 'fields'],
    };
  } else if (params.type === 'account') {
    const { owner } = params;
    const user = await github.users.getForUser({ username: owner });
    return unfurlAccount(user.data);
  }
};
