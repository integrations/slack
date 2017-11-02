const moment = require('moment');

const {
  constants,
  Message,
} = require('./index.js');

class AbstractIssue extends Message {
  constructor(constructorObject) {
    super({
      includeFooter: true,
      footerURL: constructorObject.abstractIssue.html_url,
    });
    this.abstractIssue = constructorObject.abstractIssue;
    this.repository = constructorObject.repository;
    this.eventType = constructorObject.eventType;
    this.unfurl = constructorObject.unfurl;
    this.sender = constructorObject.sender;

    this.createdAt = moment(this.abstractIssue.created_at);

    if (constants.MAJOR_MESSAGES[this.eventType] || this.unfurl) {
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
    if (merged) {
      predicate = 'merged';
    } else {
      const predicateRe = /\w+\.(\w+)/g; // e.g. match 'opened' for 'issues.opened'
      predicate = predicateRe.exec(this.eventType)[1];
    }
    return `[${this.repository.full_name}] ${subject} ${predicate} by ${this.sender.login}`;
  }

  getCore() {
    // TODO: Need to convert markdown in body to Slack markdown
    const text = this.abstractIssue.body;
    const title = `#${this.abstractIssue.number} ${this.abstractIssue.title}`;
    // eslint-disable-next-line camelcase
    const title_link = this.abstractIssue.html_url;
    const core = {
      title,
      title_link,
      fallback: title,
    };
    if (this.major) {
      core.text = text;
    }
    return core;
  }

  getBaseMessage() {
    return {
      color: this.constructor.getHexColorbyState(
        this.abstractIssue.state,
        this.abstractIssue.merged,
      ),
      ts: this.createdAt.unix(),
      mrkdwn_in: ['text'],
      ...this.getAuthor(),
      ...this.getCore(),
      ...super.getBaseMessage(),
    };
  }
}

module.exports = {
  AbstractIssue,
};
