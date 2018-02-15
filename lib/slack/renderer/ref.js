const { Message } = require('../../slack/renderer');

class Ref extends Message {
  constructor({
    eventType,
    ref,
    refType,
    sender,
    repository,
  }) {
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
      author: {
        login: sender.login,
        avatarURL: sender.avatar_url,
        htmlURL: sender.html_url,
      },
    });
    this.eventType = eventType;
    this.ref = ref;
    this.refType = refType;
    this.repository = repository;
  }

  static capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  getCore() {
    const ref = `<${`${this.repository.html_url}/tree/${this.ref}`}|\`${this.ref}\`>`;
    const text = `${this.constructor.capitalize(this.eventType)}d ${this.refType} ${ref}`;
    return {
      fallback: text,
      text,
    };
  }

  toJSON() {
    return {
      attachments: [
        {
          ...super.getBaseMessage(),
          ...this.getCore(),
          mrkdwn_in: ['text'],
        },
      ],
    };
  }
}

module.exports = {
  Ref,
};
