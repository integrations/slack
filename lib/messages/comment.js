const moment = require('moment');
const mrkdwn = require('html-to-mrkdwn');

const {
  Message,
} = require('./index');

class Comment extends Message {
  constructor({
    comment, commit, repository, issue, unfurlType,
  }) {
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
    });
    this.repository = repository;
    this.comment = comment;
    this.commit = commit;
    this.issue = issue;
    this.unfurlType = unfurlType;
  }

  getRenderedMessage() {
    let fallbackSubject = null;
    let subject = null;
    if (this.commit) {
      const firstLine = this.commit.message.split(/[\r\n]/)[0];
      fallbackSubject = `commit "${firstLine}"`;
      subject = `commit "${firstLine}"`;
    } else if (this.issue) {
      fallbackSubject = `#${this.issue.number}`;
      subject = `#${this.issue.number} ${this.issue.title}`;
    } else {
      throw new Error('Comment is missing `issue` or `commit`');
    }

    const baseMessage = {
      ...super.getBaseMessage(),
      fallback: `[${this.repository.full_name}] Comment on ${fallbackSubject}`,
      title: `Comment on ${subject}`,
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
