const ISSUE_CLOSED_RED = '#cb2431';
const ISSUE_OPEN_GREEN = '#36a64f';

const moment = require('moment');

const { arrayToFormattedString } = require('../helpers');

module.exports = function unfurlIssue(issue) {
  return {
    color: issue.state === 'open' ? ISSUE_OPEN_GREEN : ISSUE_CLOSED_RED,
    fallback: `#${issue.number} ${issue.title}`,
    author_name: issue.user.login,
    author_link: issue.user.html_url,
    author_icon: issue.user.avatar_url,
    title: `#${issue.number} ${issue.title}`,
    title_link: issue.html_url,
    text: issue.body, // We should truncate markdown that Slack doesn't understand.
    fields: [
      {
        title: 'State',
        value: issue.state === 'open' ? ':green_heart: Open' : ':heart: Closed',
        short: true,
      },
      {
        title: 'Labels',
        value: arrayToFormattedString(issue.labels, 'name'),
        short: true,
      },
      {
        title: 'Assignees',
        value: arrayToFormattedString(issue.assignees, 'login'),
        short: true,
      },
      {
        title: 'Comments',
        value: `<${issue.html_url}|:speech_balloon: ${issue.comments}>`,
        short: true,
      },
    ],
    footer: `<${issue.html_url}|View it on GitHub>`,
    footer_icon: 'https://assets-cdn.github.com/favicon.ico',
    ts: moment(issue.created_at).unix(),
    mrkdwn_in: ['pretext', 'text', 'fields'],
  };
};
