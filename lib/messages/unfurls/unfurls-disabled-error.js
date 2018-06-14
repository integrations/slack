const ErrorMessage = require('../flow/error-message');

module.exports = class UnfurlsDisabledError extends ErrorMessage {
  getAttachment() {
    const helpUrl = 'https://get.slack.help/hc/en-us/articles/204399343-Share-links-in-Slack#turn-off-link-previews-for-specific-sites';
    const attachment = {
      ...this.getErrorMessage().attachments[0],
      text: `Could not complete link preview because your workspace has disabled link previews for \`github.com\` <${helpUrl}|Read more>`,
      mrkdwn_in: ['text'],
    };
    return attachment;
  }
};
