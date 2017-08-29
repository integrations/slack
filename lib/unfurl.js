// Roadmap: What do we want to unfurl?
// Phase 1: Issues, Pull Requests, Repositories, Profiles, Organizations, App
// Phase 2: Repository contents (files), Projects, Gists

// likely need different regular expressions based on what we're trying to parse

const moment = require('moment');
const { arrayToFormattedString } = require('./helpers');
const REGEX = new RegExp('https://github.com/([^/]+)/([^/]+)/issues/(\\d+)');

const ISSUE_CLOSED_RED = '#cb2431';
const ISSUE_OPEN_GREEN = '#36a64f';

module.exports = async (github, url) => {
  const [_, owner, repo, number] = url.match(REGEX);
  const issue = await github.issues.get({owner, repo, number});
  return {
    'color': issue.data.state === 'open' ? ISSUE_OPEN_GREEN : ISSUE_CLOSED_RED,
    'fallback': `#${issue.data.number} ${issue.data.title}`,
    'author_name': issue.data.user.login,
    'author_link': issue.data.user.html_url,
    'author_icon': issue.data.user.avatar_url,
    'title': `#${issue.data.number} ${issue.data.title}`,
    'title_link': issue.data.html_url,
    'text': issue.data.body, // We should truncate markdown that Slack doesn't understand.
    'fields': [
        {
            'title': 'State',
            'value': issue.data.state === 'open' ? ':green_heart: Open' : ':heart: Closed',
            'short': true
        },
        {
            'title': 'Labels',
            'value': arrayToFormattedString(issue.data.labels, 'name'),
            'short': true
        },
        {
            'title': 'Assignees',
            'value': arrayToFormattedString(issue.data.assignees, 'login'),
            'short': true
        },
        {
            'title': 'Comments',
            'value': `<${issue.data.html_url}|:speech_balloon: ${issue.data.comments}>`,
            'short': true
        },
    ],
    'footer': `<${issue.data.html_url}|View it on GitHub>`,
    'footer_icon': 'https://assets-cdn.github.com/favicon.ico',
    'ts': moment(issue.data.created_at).unix(),
    'mrkdwn_in': ['pretext', 'text', 'fields']
  };
};
