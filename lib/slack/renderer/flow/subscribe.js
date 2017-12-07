const { Message } = require('../../renderer');

class SubscribeFlowMessage extends Message {
  constructor({ channelId, fromRepository, error, unsubscribed, input }) {
    super({});
    this.channelId = channelId;
    this.fromRepository = fromRepository;
    this.error = error;
    this.unsubscribed = unsubscribed;
    this.input = input;
  }

  getErrorText() {
    if (this.error.type === 'no-installation') {
      return `Looks like the app isn't installed on your repository. <${this.error.url}|Install the GitHub App> to proceed.`;
    }
    if (this.error.type === '404') {
      return `Could not find a repository for \`${this.input}\``;
    }
    if (this.error.type === 'invalid-link') {
      return `\`${this.input}\` does not appear to be a GitHub link.`;
    }
  }

  getRenderedMessage() {
    if (this.error) {
      return {
        response_type: 'ephemeral',
        attachments: [{
          ...this.getBaseMessage(),
          color: 'danger',
          mrkdwn_in: ['text'],
          text: this.getErrorText(),
        }],
      };
    }

    const predicate = this.unsubscribed ? 'Unsubscribed' : 'Subscribed';
    const preposition = this.unsubscribed ? 'from' : 'to';
    return {
      response_type: 'in_channel',
      attachments: [{
        ...this.getBaseMessage(),
        text: `${predicate} <#${this.channelId}> ${preposition} <${this.fromRepository.html_url}|${this.fromRepository.full_name}>`,
      }],
    };
  }
}

module.exports = {
  SubscribeFlowMessage,
};
