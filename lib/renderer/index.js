/*
- with unfurls we only have one attachment available to us, in all other cases we have multiple
- take as input the type of message. (e.g. Issue, unfurl; pr, not unfurl)
- based on type, decide capabilities: render_timestamp=true, etc.
*/
const moment = require('moment');

const { getHexColorbyState, arrayToFormattedString } = require('.././helpers');

class Issue {
  constructor(
    issue,
    repository,
    eventType, // e.g. issues.opened
    unfurl = false,
  ) {
    this.capabilities = {
      hasTimestamp: true,
      hasAuthor: true,
      hasOpenState: true,
      canHaveStateMerged: false,
    };

    this.issue = issue;
    this.createdAt = moment(issue.created_at);
    this.repository = repository;

    this.eventType = eventType;
    this.unfurl = unfurl;

    this.major = {
      'issues.opened': true,
    };
  }
  getColor() {
    return getHexColorbyState(this.issue.state);
  }
  getAuthor() {
    return {
      author_name: this.issue.user.login,
      author_link: this.issue.user.html_url,
      author_icon: this.issue.user.avatar_url,
    };
  }
  getCore() {
    // TODO: Need to convert markdown in body to Slack markdown
    const text = this.issue.body;
    const title = `#${this.issue.number} ${this.issue.title}`;
    // eslint-disable-next-line camelcase
    const title_link = this.issue.html_url;
    if (this.unfurl) {
      return {
        text,
        title,
        title_link,
        fallback: title,
      };
    }
    const core = {
      title,
      title_link,
    };
    if (this.major[this.eventType]) {
      core.text = text;
    }
    const preText = action => `[${this.repository.full_name}] Issue ${action} by ${this.issue.user.login}`;
    // TODO: refactor and match on regex
    if (this.eventType === 'issues.opened') {
      core.pretext = preText('opened');
      core.fallback = core.pretext;
    } else if (this.eventType === 'issues.closed') {
      core.pretext = preText('closed');
      core.fallback = core.pretext;
    } else if (this.eventType === 'issues.reopened') {
      core.pretext = preText('reopened');
      core.fallback = core.pretext;
    }
    return core;
  }
  getFields() {
    // projects should be a field as well, but seems to not be easily available via API?
    if (!this.major[this.eventType] && !this.unfurl) {
      return null;
    }
    const fields = [
      {
        title: 'Assignees',
        value: arrayToFormattedString(this.issue.assignees, 'login'),
      },
      {
        title: 'Labels',
        value: arrayToFormattedString(this.issue.labels, 'name'),
      },
      {
        title: 'Comments',
        value: this.issue.comments,
      },
      {
        title: 'Milestone',
        value: this.issue.milestone,
      },
    ];
    return fields.filter(field => field.value)
      .map(field => ({ ...field, short: true }))
      .slice(0, 2);
  }
  getFooter() {
    return {
      footer: `<${this.issue.html_url}|View it on GitHub>`,
      footer_icon: 'https://assets-cdn.github.com/favicon.ico',
    };
  }
  getFullSlackMessageAttachment() {
    const attachment = {
      color: this.getColor(),
      ...this.getAuthor(),
      ...this.getCore(),
      ts: this.createdAt.unix(),
      mrkdwn_in: ['text'],
      ...this.getFooter(),
    };
    // Ideally the below logic should apply to all keys
    // in the attachment object, but not sure what the
    // most beautiful way to do that is.
    if (this.getFields()) {
      attachment.fields = this.getFields();
    }
    return attachment;
  }
  getRenderedMessage() {
    return {
      attachments: [
        this.getFullSlackMessageAttachment(),
      ],
    };
  }
}

class Message {
  constructor(GitHubObjectType, unfurl = false) {
    this.gitHubObjectType = GitHubObjectType;
    this.unfurl = unfurl;
  }

  renderAndGet() {
    // need seperate logic in here for single unfurl attachment and multiple attachments
    return {
      attachments: [
        this.attachment,
      ],
    };
  }

}

// TODO: /github test-run -> delivers all webhooks we're currently ready to receive

module.exports = {
  Message,
  Issue,
};
