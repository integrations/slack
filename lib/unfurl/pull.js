const moment = require('moment');

const {
  arrayToFormattedString,
  getHexColorbyState,
  getFormattedState,
} = require('../helpers');

module.exports = function unfurlPull(pull, params) {
  return {
    fallback: `${params.owner}/${params.repo}#${pull.number}: ${pull.title}`,
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
};
