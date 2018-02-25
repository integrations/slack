const { Message, getChannelString } = require('..');

module.exports = class UpdatedSettings extends Message {
  constructor({ subscription, repository }) {
    super({});
    this.subscription = subscription;
    this.repository = repository;
  }

  get channel() {
    return getChannelString(this.subscription.channelId);
  }

  get enabledSettings() {
    return this.subscription.getEnabledSettings().map(setting => `\`${setting}\``).join(', ');
  }

  get repositoryLink() {
    return `<${this.repository.html_url}|${this.repository.full_name}>`;
  }

  toJSON() {
    return {
      response_type: 'in_channel',
      attachments: [{
        ...this.getBaseMessage(),
        text: `${this.channel}will get notifications from ${this.repositoryLink} for: \n` +
          `${this.enabledSettings}`,
        footer: '<https://github.com/integrations/slack#configuration|Learn More>',
        mrkdwn_in: ['text', 'footer'],
      }],
    };
  }
};
