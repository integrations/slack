const { Message } = require('..');

module.exports = class UpdatedSettings extends Message {
  constructor({ subscription, resource }) {
    super({});
    this.subscription = subscription;
    this.resource = resource;
  }

  get enabledSettings() {
    return this.subscription.getEnabledSettings().map(setting => `\`${setting}\``).join(', ');
  }

  get resourceName() {
    return this.resource.full_name || this.resource.login;
  }

  get resourceLink() {
    return `<${this.resource.html_url}|${this.resourceName}>`;
  }

  toJSON() {
    return {
      response_type: 'in_channel',
      attachments: [{
        ...this.getBaseMessage(),
        text: `This channel will get notifications from ${this.resourceLink} for: \n` +
          `${this.enabledSettings}`,
        footer: '<https://github.com/integrations/slack#configuration|Learn More>',
        mrkdwn_in: ['text', 'footer'],
      }],
    };
  }
};
