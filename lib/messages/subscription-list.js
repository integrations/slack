const { getChannelString, Message } = require('.');

module.exports = class SubscriptionList extends Message {
  constructor(repositories, organizations, channelId) {
    super({});
    this.repositories = repositories;
    this.organizations = organizations;
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
      }, {
        ...this.getBaseMessage(),
        fallback: `${prefix} ${this.organizations.length} organization${this.organizations.length === 1 ? '' : 's'}`,
      }],
      response_type: 'in_channel',
    };
    if (this.repositories.length > 0) {
      output.attachments[0].title = prefix;
      output.attachments[0].text = this.repositoriesToString().join('\n');
    } else {
      output.attachments[0].text = output.attachments[0].fallback;
    }
    if (this.organizations.length > 0) {
      output.attachments[1].title = prefix;
      output.attachments[1].text = this.organizationsToString().join('\n');
    } else {
      output.attachments[1].text = output.attachments[1].fallback;
    }
    return output;
  }

  repositoriesToString() {
    return this.repositories
      .sort((repoA, repoB) => {
        if (repoA.full_name.toLowerCase() > repoB.full_name.toLowerCase()) {
          return 1;
        }
        return -1;
      })
      .map(repository => (
        `<${repository.html_url}|${repository.full_name}>`
      ));
  }

  organizationsToString() {
    return this.organizations
      .sort((orgA, orgB) => {
        if (orgA.login.toLowerCase() > orgB.login.toLowerCase()) {
          return 1;
        }
        return -1;
      })
      .map(organization => (
        `<${organization.html_url}|${organization.login}>`
      ));
  }
};
