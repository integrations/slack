const { Message, getChannelString } = require('../../renderer');

module.exports = class Subscribed extends Message {
  constructor({ subscription, repository, unsubscribed = false }) {
    super({});
    this.channelId = subscription.channelId;
    this.repository = repository;
    this.unsubscribed = unsubscribed;
  }

  toJSON() {
    const predicate = this.unsubscribed ? 'Unsubscribed' : 'Subscribed';
    const preposition = this.unsubscribed ? 'from' : 'to';
    return {
      response_type: 'in_channel',
      attachments: [{
        ...this.getBaseMessage(),
        text: `${predicate} ${getChannelString(this.channelId)}${preposition} <${this.repository.html_url}|${this.repository.full_name}>`,
      }],
    };
  }
};
