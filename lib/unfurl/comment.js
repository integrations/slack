const moment = require('moment');

module.exports = function unfurlComment(comment, issue) {
  return {
    fallback: `Comment on #${issue.number} by @${comment.user.login}`,
    title: `#${issue.number} ${issue.title}`,
    title_link: comment.html_url,
    author_name: comment.user.login,
    author_link: comment.user.html_url,
    author_icon: comment.user.avatar_url,
    text: comment.body, // We should truncate markdown that Slack doesn't understand.
    footer: `<${comment.html_url}|View it on GitHub>`,
    footer_icon: 'https://assets-cdn.github.com/favicon.ico',
    ts: moment(comment.created_at).unix(),
    mrkdwn_in: ['pretext', 'text', 'fields'],
  };
};
