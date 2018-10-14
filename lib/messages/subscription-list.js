const { Message } = require('.');

module.exports = class SubscriptionList extends Message {
  constructor(repositories) {
    super({});
    this.repositories = repositories;
  }

  toJSON() {
    const prefix = 'Subscribed to';
    const output = {
      attachments: [{
        ...this.getBaseMessage(),
        fallback: `${prefix} ${this.repositories.length} repositor${this.repositories.length === 1 ? 'y' : 'ies'}`,
      }],
      response_type: 'in_channel',
    };
    if (this.repositories.length > 0) {
      output.attachments[0].title = prefix;
      output.attachments[0].text = this.repositoriesToString().join('\n');
      return output;
    }
    output.attachments[0].text = output.attachments[0].fallback;
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
};
