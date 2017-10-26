const moment = require('moment');

const {
  constants,
} = require('./index.js');

class AbstractIssue {
  constructor(constructorObject) {
    this.abstractIssue = constructorObject.abstractIssue;
    this.repository = constructorObject.repository;
    this.eventType = constructorObject.eventType;
    this.unfurl = constructorObject.unfurl;

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

  getPreText(subject) {
    const predicateRe = /\w+\.(\w+)/g; // e.g. match 'opened' for 'issues.opened'
    const predicate = predicateRe.exec(this.eventType);
    return `[${this.repository.full_name}] ${subject} ${predicate[1]} by ${this.abstractIssue.user.login}`;
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

  // footer should likely be in `Message`
  getFooter() {
    return {
      footer: `<${this.abstractIssue.html_url}|View it on GitHub>`,
      footer_icon: 'https://assets-cdn.github.com/favicon.ico',
    };
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
      ...this.getFooter(),
    };
  }
}

module.exports = {
  AbstractIssue,
};
