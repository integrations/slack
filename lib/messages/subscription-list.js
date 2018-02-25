const { getChannelString, Message } = require('.');

module.exports = class SubscriptionList extends Message {
  constructor(repositories, channelId) {
    super({});
    this.repositories = repositories;
    this.channel = getChannelString(channelId);
  }

  toJSON() {
    let prefix;
    if (this.channel) {
      prefix = `${this.channel}is subscribed to`;
    } else {
      prefix = 'Subscribed to';
    }
    const output = {
      attachments: [{
        ...this.getBaseMessage(),
        fallback: `${prefix} ${this.repositories.length} repositor${this.repositories.length === 1 ? 'y' : 'ies'}`,
      }],
      response_type: 'in_channel',
    };
    if (this.repositories.length > 0) {
      output.attachments[0].title = prefix;
      output.attachments[0].text = this.repositoriesToString().join('\n');
      return output;
    }
    output.attachments[0].text = output.attachments[0].fallback;
    return output;
  }

  repositoriesToString() {
    return this.repositories.map(repository => (
      `<${repository.html_url}|${repository.full_name}>`
    ));
  }
};
