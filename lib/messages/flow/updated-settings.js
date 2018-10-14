const { Message } = require('..');

module.exports = class UpdatedSettings extends Message {
  constructor({ subscription, repository }) {
    super({});
    this.subscription = subscription;
    this.repository = repository;
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
        text: `This channel will get notifications from ${this.repositoryLink} for: \n` +
          `${this.enabledSettings}`,
        footer: '<https://github.com/integrations/slack#configuration|Learn More>',
        mrkdwn_in: ['text', 'footer'],
      }],
    };
  }
};
