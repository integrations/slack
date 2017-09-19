// Roadmap: What do we want to unfurl?
// Phase 1: Issues, Pull Requests, Repositories, Profiles, Organizations, App
// Phase 2: Repository contents (files), Projects, Gists

// likely need different regular expressions based on what we're trying to parse

const moment = require('moment');
const githubUrl = require('./github-url');
const unfurlComment = require('./unfurl/comment');

const ISSUE_CLOSED_RED = '#cb2431';
const ISSUE_OPEN_GREEN = '#36a64f';

const {
  arrayToFormattedString,
  getHexColorbyState,
  getFormattedState,
} = require('./helpers');

module.exports = async (github, url) => {
  const { type, owner, repo, number, id } = githubUrl(url);

  if (type === 'comment') {
    const issue = await github.issues.get({ owner, repo, number });
    const comment = await github.issues.getComment({ owner, repo, id });
    return unfurlComment(comment.data, issue.data);
  } else if (type === 'issue') {
    const issue = await github.issues.get({ owner, repo, number });

    return {
      color: issue.data.state === 'open' ? ISSUE_OPEN_GREEN : ISSUE_CLOSED_RED,
      fallback: `#${issue.data.number} ${issue.data.title}`,
      author_name: issue.data.user.login,
      author_link: issue.data.user.html_url,
      author_icon: issue.data.user.avatar_url,
      title: `#${issue.data.number} ${issue.data.title}`,
      title_link: issue.data.html_url,
      text: issue.data.body, // We should truncate markdown that Slack doesn't understand.
      fields: [
        {
          title: 'State',
          value: issue.data.state === 'open' ? ':green_heart: Open' : ':heart: Closed',
          short: true,
        },
        {
          title: 'Labels',
          value: arrayToFormattedString(issue.data.labels, 'name'),
          short: true,
        },
        {
          title: 'Assignees',
          value: arrayToFormattedString(issue.data.assignees, 'login'),
          short: true,
        },
        {
          title: 'Comments',
          value: `<${issue.data.html_url}|:speech_balloon: ${issue.data.comments}>`,
          short: true,
        },
      ],
      footer: `<${issue.data.html_url}|View it on GitHub>`,
      footer_icon: 'https://assets-cdn.github.com/favicon.ico',
      ts: moment(issue.data.created_at).unix(),
      mrkdwn_in: ['pretext', 'text', 'fields'],
    };
  } else if (type === 'pull') {
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
  }
};
