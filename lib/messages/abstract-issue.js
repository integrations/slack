const moment = require('moment');
const mrkdwn = require('html-to-mrkdwn');
const { getHexColorByState } = require('../helpers');

const {
  constants,
  Message,
} = require('.');

class AbstractIssue extends Message {
  constructor(constructorObject) {
    super({
      footer: `<${constructorObject.repository.html_url}|${constructorObject.repository.full_name}>`,
    });
    this.abstractIssue = constructorObject.abstractIssue;
    this.repository = constructorObject.repository;
    this.eventType = constructorObject.eventType;
    this.unfurlType = constructorObject.unfurlType;
    this.sender = constructorObject.sender;
    this.format = constructorObject.format;

    this.createdAt = moment(this.abstractIssue.created_at);

    if ((this.format === 'full' && constants.MAJOR_MESSAGES[this.eventType]) || this.unfurlType === 'full') {
      this.major = true;
    }
  }

  getAuthor() {
    return {
      author_name: this.abstractIssue.user.login,
      author_link: this.abstractIssue.user.html_url,
      author_icon: this.abstractIssue.user.avatar_url,
    };
  }

  getPreText(subject, merged = false) {
    let predicate;
    let actor;
    if (merged) {
      predicate = 'merged';
    } else {
      const predicateRe = /\w+\.(\w+)/g; // e.g. match 'opened' for 'issues.opened'
      [, predicate] = predicateRe.exec(this.eventType);
    }
    if (this.sender) {
      actor = this.sender.login;
    } else {
      actor = this.abstractIssue.user.login;
    }
    return `${subject} ${predicate.replace(/_/g, ' ')} by ${actor}`; // e.g. replace 'ready_for_review' with 'ready for review'
  }

  getCore() {
    const title = `#${this.abstractIssue.number} ${this.abstractIssue.title}`;
    // eslint-disable-next-line camelcase
    const title_link = this.abstractIssue.html_url;
    const core = {
      title,
      title_link,
      fallback: `[${this.repository.full_name}] ${title}`,
    };
    if (this.major) {
      if (this.abstractIssue.body_html) {
        const { text, image } = mrkdwn(this.abstractIssue.body_html);
        core.text = text;
        core.image_url = image;
      } else {
        core.text = this.abstractIssue.body;
      }
    }
    return core;
  }

  getBaseMessage() {
    return {
      ...super.getBaseMessage(),
      color: getHexColorByState(
        this.abstractIssue.state,
        this.abstractIssue.merged,
        this.abstractIssue.draft,
      ),
      ts: this.createdAt.unix(),
      mrkdwn_in: ['text'],
      ...(this.major ? this.getAuthor() : {}),
      ...this.getCore(),
    };
  }
}

module.exports = {
  AbstractIssue,
};
