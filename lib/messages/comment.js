const moment = require('moment');
const mrkdwn = require('html-to-mrkdwn');

const {
  Message,
} = require('./index');

class Comment extends Message {
  constructor({
    comment, repository, issue, unfurlType,
  }) {
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
    });
    this.repository = repository;
    this.comment = comment;
    this.issue = issue;
    this.unfurlType = unfurlType;
  }

  getRenderedMessage() {
    const baseMessage = {
      ...super.getBaseMessage(),
      fallback: `[${this.repository.full_name}] Comment on #${this.issue.number}`,
      title: `Comment on #${this.issue.number} ${this.issue.title}`,
      title_link: this.comment.html_url,
      author_name: this.comment.user.login,
      author_link: this.comment.user.html_url,
      author_icon: this.comment.user.avatar_url,
      ts: moment(this.comment.created_at).unix(),
      mrkdwn_in: ['text'],
    };

    if (this.comment.body_html) {
      const { text, image } = mrkdwn(this.comment.body_html);
      baseMessage.text = text;
      baseMessage.image_url = image;
    } else {
      baseMessage.text = this.comment.body;
    }

    if (this.unfurlType === 'condensed') {
      return this.constructor.convertToCondensedAttachment(baseMessage);
    }
    return baseMessage;
  }
}

module.exports = {
  Comment,
};
