const { Message } = require('.');

class Public extends Message {
  constructor({ repository, sender }) {
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
      author: {
        login: sender.login,
        avatarURL: sender.avatar_url,
        htmlURL: sender.html_url,
      },
    });
    this.repository = repository;
  }

  toJSON() {
    const text = `${this.repository.full_name} is now public!`;
    return {
      attachments: [
        {
          ...super.getBaseMessage(),
          text,
          fallback: text,
          image_url: 'https://octodex.github.com/images/welcometocat.png',
        },
      ],
    };
  }
}

module.exports = {
  Public,
};
