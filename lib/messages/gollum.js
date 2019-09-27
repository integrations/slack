const { Message } = require('.');

class GollumMessage extends Message {
  constructor({ gollum }) {
    super({
      footer: `<${gollum.repository.html_url}|${gollum.repository.full_name}>`,
      author: {
        login: gollum.sender.login,
        avatarURL: gollum.sender.avatar_url,
        htmlURL: gollum.sender.html_url,
      },
    });
    this.gollum = gollum;
  }

  get pages() {
    return this.gollum.pages.map(
      (page) => `${page.action} <${page.html_url}|${page.title}>`,
    ).join('\n');
  }

  get summary() {
    const noOfPages = this.gollum.pages.length;
    const pagesStr = noOfPages === 1 ? 'page' : 'pages';

    return `${noOfPages} wiki ${pagesStr} changed`;
  }

  getRenderedMessage() {
    return {
      attachments: [
        {
          ...super.getBaseMessage(),
          fallback: `[${this.gollum.repository.full_name}] ${this.summary}`,
          text: `*${this.summary}*\n${this.pages}`,
          mrkdwn_in: ['text'],
        },
      ],
    };
  }
}

module.exports = {
  GollumMessage,
};
