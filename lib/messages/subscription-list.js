const { getChannelString, Message } = require('.');

module.exports = class SubscriptionList extends Message {
  constructor(resources, channelId) {
    super({});
    this.resources = resources;
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
        fallback: `${prefix} ${this.resources.length} resource${this.resources.length === 1 ? '' : 's'}`,
      }],
      response_type: 'in_channel',
    };
    if (this.resources.length > 0) {
      output.attachments[0].title = prefix;
      output.attachments[0].text = this.resourcesToString().join('\n');
      return output;
    }
    output.attachments[0].text = output.attachments[0].fallback;
    return output;
  }

  resourcesToString() {
    return this.resources
      .sort((resourceA, resourceB) => {
        const displayA = (resourceA.full_name || resourceA.login).toLowerCase();
        const displayB = (resourceB.full_name || resourceB.login).toLowerCase();
        return displayA > displayB ? 1 : -1;
      })
      .map(resource => (
        `<${resource.html_url}|${resource.full_name || resource.login}>`
      ));
  }
};
