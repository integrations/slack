const { Message } = require('../../renderer');

class Subscribed extends Message {
  constructor({ channelId, fromRepository, unsubscribed }) {
    super({});
    this.channelId = channelId;
    this.fromRepository = fromRepository;
    this.unsubscribed = unsubscribed;
  }

  getChannelString() {
    switch (this.channelId[0]) {
      default:
        return `<#${this.channelId}> `;
      case 'D':
      case 'G':
        return '';
    }
  }

  toJSON() {
    const predicate = this.unsubscribed ? 'Unsubscribed' : 'Subscribed';
    const preposition = this.unsubscribed ? 'from' : 'to';
    return {
      response_type: 'in_channel',
      attachments: [{
        ...this.getBaseMessage(),
        text: `${predicate} ${this.getChannelString()}${preposition} <${this.fromRepository.html_url}|${this.fromRepository.full_name}>`,
      }],
    };
  }
}

module.exports = {
  Subscribed,
};
