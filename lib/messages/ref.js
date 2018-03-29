const { Message } = require('.');

class Ref extends Message {
  constructor({
    event,
    ref,
    ref_type,
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
    this.event = event;
    this.ref = ref;
    this.refType = ref_type;
    this.repository = repository;
  }

  static capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  getCore() {
    const ref = `<${`${this.repository.html_url}/tree/${this.ref}`}|\`${this.ref}\`>`;
    const text = `${this.constructor.capitalize(this.event)}d ${this.refType} ${ref}`;
    return {
      fallback: `[${this.repository.full_name}] ${text}`,
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
