const { Message } = require('..');

module.exports = class Subscribed extends Message {
  constructor({ fromRepository, unsubscribed }) {
    super({});
    this.fromRepository = fromRepository;
    this.unsubscribed = unsubscribed;
  }

  toJSON() {
    const predicate = this.unsubscribed ? 'Unsubscribed' : 'Subscribed';
    const preposition = this.unsubscribed ? 'from' : 'to';
    return {
      response_type: 'in_channel',
      attachments: [{
        ...this.getBaseMessage(),
        text: `${predicate} ${preposition} <${this.fromRepository.html_url}|${this.fromRepository.full_name}>`,
      }],
    };
  }
};
