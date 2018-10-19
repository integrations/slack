const { getChannelString, Message } = require('.');

module.exports = class SubscriptionList extends Message {
  constructor(repositories, accounts, channelId) {
    super({});
    this.repositories = repositories;
    this.accounts = accounts;
    this.channel = getChannelString(channelId);
  }

  toJSON() {
    if (this.repositories.length === 0 && this.accounts.length === 0) {
      const title = this.channel
        ? `${this.channel}is not subscribed to any repositories or accounts`
        : 'Not subscribed to any repositories or accounts';
      return {
        attachments: [{
          ...this.getBaseMessage(),
          fallback: title,
          title,
        }],
        response_type: 'in_channel',
      };
    }

    const prefix = this.channel ? `${this.channel}is subscribed to` : 'Subscribed to';
    const output = {
      attachments: [],
      response_type: 'in_channel',
    };
    if (this.repositories.length > 0) {
      output.attachments.push({
        ...this.getBaseMessage(),
        fallback: `${prefix} ${this.repositories.length} repositor${this.repositories.length === 1 ? 'y' : 'ies'}`,
        title: `${prefix} the following repositories`,
        text: this.repositoriesToString().join('\n'),
      });
    }
    if (this.accounts.length > 0) {
      output.attachments.push({
        ...this.getBaseMessage(),
        fallback: `${prefix} ${this.accounts.length} account${this.accounts.length === 1 ? '' : 's'}`,
        title: `${prefix} the following accounts`,
        text: this.accountsToString().join('\n'),
      });
    }
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
