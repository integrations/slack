const { Message } = require('..');

module.exports = class ReEnableMultipleSubscriptions extends Message {
  constructor(subscribedRepositories, creator, reason) {
    super({});
    this.plural = subscribedRepositories.length !== 1;
    this.repositories = subscribedRepositories;
    this.creator = creator;
    this.reason = reason;
  }

  get introduction() {
    return `${this.plural ? 'Subscriptions' : 'The subscription'} to ` +
     `${this.repositories.length} ${this.plural ? 'repositories have' : 'repository has'} been disabled, ` +
      `because <@${this.creator}>, who originally set ${this.plural ? 'them' : 'it'} up, has ${this.reason}.\n` +
      `Use the following slash command${this.plural ? 's' : ''} to re-enable the subscription${this.plural ? 's' : ''}:`;
  }

  get commands() {
    return this.repositories.map(repository => (
      `/github subscribe ${repository.full_name}`
    )).join('\n');
  }

  getAttachment() {
    return {
      ...this.getBaseMessage(),
      mrkdwn_in: ['text'],
      text: `${this.introduction}\n${this.commands}`,
    };
  }

  toJSON() {
    return {
      attachments: [this.getAttachment()],
      response_type: 'in_channel',
    };
  }
};
