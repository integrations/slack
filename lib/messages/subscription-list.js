const { getChannelString, Message } = require('.');

module.exports = class SubscriptionList extends Message {
  constructor(repositories, accounts, channelId) {
    super({});
    this.repositories = repositories;
    this.accounts = accounts;
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
        title: `${prefix} these repositories`,
        text: this.repositories.length > 0 ? this.repositoriesToString().join('\n') : 'no repositories',
      }, {
        ...this.getBaseMessage(),
        fallback: `${prefix} ${this.accounts.length} account${this.accounts.length === 1 ? '' : 's'}`,
        title: `${prefix} these accounts`,
        text: this.accounts.length > 0 ? this.accountsToString().join('\n') : 'no accounts',
      }],
      response_type: 'in_channel',
    };
    return output;
  }

  repositoriesToString() {
    return this.repositories
      .sort((repoA, repoB) => {
        const displayA = repoA.full_name.toLowerCase();
        const displayB = repoB.full_name.toLowerCase();
        return displayA > displayB ? 1 : -1;
      })
      .map(repo => (
        `<${repo.html_url}|${repo.full_name}>`
      ));
  }

  accountsToString() {
    return this.accounts
      .sort((accountA, accountB) => {
        const displayA = accountA.login.toLowerCase();
        const displayB = accountB.login.toLowerCase();
        return displayA > displayB ? 1 : -1;
      })
      .map(account => (
        `<${account.html_url}|${account.login}>`
      ));
  }
};
