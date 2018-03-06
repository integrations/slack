const {
  Message,
} = require('./index');

module.exports = class RepositoryDeleted extends Message {
  constructor({ repository, sender }) {
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
    });
    this.repository = repository;
    this.sender = sender;
  }

  toJSON() {
    const pretext = `Repository deleted by ${this.sender.login}`;

    return {
      attachments: [{
        ...super.getBaseMessage(),
        fallback: pretext,
        pretext,
        text: 'The subscription to this repository has been disabled.',
      }],
    };
  }
};
