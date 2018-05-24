const { Message, getChannelString } = require('..');

module.exports = class Subscribed extends Message {
  constructor({ channelId, resource, unsubscribed }) {
    super({});
    this.channelId = channelId;
    this.resource = resource;
    this.unsubscribed = unsubscribed;
  }

  get channel() {
    return getChannelString(this.channelId);
  }

  get resourceName() {
    return this.resource.full_name || this.resource.login;
  }

  get resourceLink() {
    return `<${this.resource.html_url}|${this.resourceName}>`;
  }

  toJSON() {
    const predicate = this.unsubscribed ? 'Unsubscribed' : 'Subscribed';
    const preposition = this.unsubscribed ? 'from' : 'to';
    return {
      response_type: 'in_channel',
      attachments: [{
        ...this.getBaseMessage(),
        text: `${predicate} ${this.channel}${preposition} ${this.resourceLink}`,
      }],
    };
  }
};
