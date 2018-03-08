const { Repository } = require('./repository');

module.exports = class RepositoryDeleted extends Repository {
  constructor({ repository, sender }) {
    super({
      repository,
      unfurlType: 'condensed',
    });
    this.sender = sender;
  }

  toJSON() {
    const pretext = `Repository deleted by ${this.sender.login}`;

    return {
      attachments: [{
        ...super.getRenderedMessage(),
        fallback: pretext,
        pretext,
      }],
    };
  }
};
