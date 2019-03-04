const { Message } = require('.');

module.exports = class SubscriptionList extends Message {
  constructor(subscriptions, repositories, accounts, showFeatureInformation = false) {
    super({});
    this.subscriptions = subscriptions;
    this.repositories = repositories;
    this.accounts = accounts;
    this.showFeatureInformation = showFeatureInformation;
  }

  getFormattedSubscriptionSettings(githubId, type) {
    return this.subscriptions.find(subscription => (
      subscription.type === type && subscription.githubId.toString() === githubId.toString()
    ))
      .getEnabledSettings().map(setting => `\`${setting}\``).join(', ');
  }

  toJSON() {
    if (this.repositories.length === 0 && this.accounts.length === 0) {
      const title = 'Not subscribed to any repositories or accounts';
      return {
        attachments: [{
          ...this.getBaseMessage(),
          fallback: title,
          title,
        }],
        response_type: 'in_channel',
      };
    }

    const prefix = 'Subscribed to';
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

    if (this.showFeatureInformation) {
      output.attachments.push({
        ...this.getBaseMessage(),
        footer: '<https://github.com/integrations/slack#configuration|Learn More>',
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
      .map((repo) => {
        if (this.showFeatureInformation) {
          const settings = this.getFormattedSubscriptionSettings(repo.id, 'repo');
          return `<${repo.html_url}|${repo.full_name}>\n${settings}\n\n`;
        }
        return `<${repo.html_url}|${repo.full_name}>`;
      });
  }

  accountsToString() {
    return this.accounts
      .sort((accountA, accountB) => {
        const displayA = accountA.login.toLowerCase();
        const displayB = accountB.login.toLowerCase();
        return displayA > displayB ? 1 : -1;
      })
      .map((account) => {
        if (this.showFeatureInformation) {
          const settings = this.getFormattedSubscriptionSettings(account.id, 'account');
          return `<${account.html_url}|${account.login}>\n${settings}\n\n`;
        }
        return `<${account.html_url}|${account.login}>`;
      });
  }
};
