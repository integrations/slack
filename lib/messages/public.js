const { Message } = require('.');

class Public extends Message {
  constructor({ publicEvent }) {
    super({
      footer: `<${publicEvent.repository.html_url}|${publicEvent.repository.full_name}>`,
      author: {
        login: publicEvent.sender.login,
        avatarURL: publicEvent.sender.avatar_url,
        htmlURL: publicEvent.sender.html_url,
      },
    });
    this.publicEvent = publicEvent;
  }

  toJSON() {
    const text = `${this.publicEvent.repository.full_name} is now public!`;
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
