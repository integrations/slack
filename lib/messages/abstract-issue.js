const moment = require('moment');
const mrkdwn = require('html-to-mrkdwn');

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

    this.createdAt = moment(this.abstractIssue.created_at);

    if (constants.MAJOR_MESSAGES[this.eventType] || this.unfurlType === 'full') {
      this.major = true;
    }
  }

  static getHexColorbyState(state, merged = false) {
    if (state === 'open') {
      return constants.OPEN_GREEN;
    } else if (state === 'closed' && merged === false) {
      return constants.CLOSED_RED;
    } else if (state === 'closed' && merged === true) {
      return constants.MERGED_PURPLE;
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
    return `${subject} ${predicate} by ${actor}`;
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
      color: this.constructor.getHexColorbyState(
        this.abstractIssue.state,
        this.abstractIssue.merged,
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
