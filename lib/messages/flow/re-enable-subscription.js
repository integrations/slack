const { Message } = require('..');

module.exports = class ReEnableSubscription extends Message {
  constructor(repository, creator) {
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
    });
    this.repository = repository;
    this.creator = creator;
  }

  getAttachment() {
    return {
      ...this.getBaseMessage(),
      mrkdwn_in: ['text'],
      text: `Subscription to \`${this.repository.full_name}\` has been disabled, ` +
      `because <@${this.creator}>, who originally set it up, no longer has access.\n` +
      `Run \`/github subscribe ${this.repository.full_name}\` to re-enable the subscription.`,
    };
  }

  toJSON() {
    return {
      attachments: [this.getAttachment()],
      response_type: 'in_channel',
    };
  }
};
