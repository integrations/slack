const { Message } = require('..');

module.exports = class ReEnableMultipleSubscriptions extends Message {
  constructor(subscribedRepositories, subscribedAccounts, creator, reason) {
    super({});
    const total = subscribedRepositories.length + subscribedAccounts.length;
    this.plural = total !== 1;
    this.repositories = subscribedRepositories;
    this.accounts = subscribedAccounts;
    this.creator = creator;
    this.reason = reason;
  }

  get introduction() {
    const message = [
      this.repositories.length > 0 ? `${this.repositories.length} ${this.repositories.length > 1 ? 'repositories' : 'repository'}` : null,
      this.accounts.length > 0 ? `${this.accounts.length} ${this.accounts.length > 1 ? 'accounts' : 'account'}` : null,
    ].filter(Boolean).join(' and ');
    return `${this.plural ? 'Subscriptions' : 'The subscription'} to ${message} ${this.plural ? 'have' : 'has'} been disabled ` +
      `because <@${this.creator}>, who originally set ${this.plural ? 'them' : 'it'} up, has ${this.reason}.\n` +
      `Use the following slash command${this.plural ? 's' : ''} to re-enable the subscription${this.plural ? 's' : ''}:`;
  }

  get commands() {
    return [
      ...this.repositories.map(repository => (
        `/github subscribe ${repository.full_name}`
      )),
      ...this.accounts.map(account => (
        `/github subscribe ${account.login}`
      )),
    ].join('\n');
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
