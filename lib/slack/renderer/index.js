/*
- with unfurls we only have one attachment available to us, in all other cases we have multiple
- take as input the type of message. (e.g. Issue, unfurl; pr, not unfurl)
- based on type, decide capabilities: render_timestamp=true, etc.
*/
const moment = require('moment');

const { getHexColorbyState, arrayToFormattedString } = require('../../helpers');

const constants = {
  CLOSED_RED: '#cb2431',
  OPEN_GREEN: '#36a64f',
  MERGED_PURPLE: '#6f42c1',
  STATUS_SUCCESS: '#28a745',
  STATUS_PENDING: '#dbab09',
  STATUS_FAILURE: '#cb2431',
  BASE_ATTACHMENT_COLOR: '#24292f',
  ATTACHMENT_FIELD_LIMIT: 2,
};

class Status {
  constructor(
    status,
  ) {
    this.status = status;
  }

  static getStatusColor(status) {
    if (status === 'success') {
      return constants.STATUS_SUCCESS;
    } else if (status === 'pending') {
      return constants.STATUS_PENDING;
    } else if (status === 'failure' || status === 'error') {
      return constants.STATUS_FAILURE;
    }
  }

  renderAttachment() {
    return {
      fallback: this.status.description,
      author_name: this.status.context,
      author_icon: this.status.avatar_url,
      author_link: this.status.target_url,
      text: this.status.description,
      color: this.constructor.getStatusColor(this.status.state),
      mrkdwn_in: ['text'],
    };
  }
}

// class AbstractIssue {
//
// }

// @todo: Extract and better deal with methods that could be static methods
class Issue {
  constructor(
    issue,
    repository,
    eventType, // e.g. issues.opened
    unfurl = false,
  ) {
    // capabilities are not used at the moment
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
      fallback: title,
    };
    if (this.major[this.eventType]) {
      core.text = text;
    }
    const preText = action => `[${this.repository.full_name}] Issue ${action} by ${this.issue.user.login}`;

    const actionre = /\w+\.(\w+)/g; // e.g. match 'opened' for 'issues.opened'
    const action = actionre.exec(this.eventType);
    if (action) {
      core.pretext = preText(action[1]);
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
      .slice(0, constants.ATTACHMENT_FIELD_LIMIT);
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

class PullRequest {
  // pre-text should always be in the first attachment
  constructor(
    pullRequest,
    repository,
    eventType, // e.g. pull_request.opened
    unfurl = false,
    statuses,
  ) {
    // capabilities are not used at the moment
    this.capabilities = {
      hasTimestamp: true,
      hasAuthor: true,
      hasOpenState: true,
      canHaveStateMerged: true,
    };

    this.pullRequest = pullRequest;
    this.createdAt = moment(pullRequest.created_at);
    this.repository = repository;

    this.eventType = eventType;
    this.unfurl = unfurl;
    this.statuses = statuses;

    this.major = {
      'pull_request.opened': true,
    };
  }
  getColor() {
    return getHexColorbyState(
        this.pullRequest.state,
        this.pullRequest.merged,
    );
  }
  getAuthor() {
    return {
      author_name: this.pullRequest.user.login,
      author_link: this.pullRequest.user.html_url,
      author_icon: this.pullRequest.user.avatar_url,
    };
  }
  getCore() {
    // TODO: Need to convert markdown in body to Slack markdown
    const text = this.pullRequest.body;
    const title = `#${this.pullRequest.number} ${this.pullRequest.title}`;
    // eslint-disable-next-line camelcase
    const title_link = this.pullRequest.html_url;
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
      fallback: title,
    };
    if (this.major[this.eventType]) {
      core.text = text;
    }
    return core;
  }
  getFields() {
    // projects should be a field as well, but seems to not be easily available via API?
    if (!this.major[this.eventType] && !this.unfurl) {
      return null;
    }
    // reviewers should be in these fields, but no
    // obvious way to do that
    const fields = [
      {
        title: 'Assignees',
        value: arrayToFormattedString(this.pullRequest.assignees, 'login'),
      },
      {
        title: 'Labels',
        value: arrayToFormattedString(this.pullRequest.labels, 'name'),
      },
      {
        title: 'Comments',
        value: this.pullRequest.comments,
      },
      {
        title: 'Milestone',
        value: this.pullRequest.milestone,
      },
    ];

    return fields.filter(field => field.value)
      .map(field => ({ ...field, short: true }))
      .slice(0, constants.ATTACHMENT_FIELD_LIMIT);
  }
  getFooter() {
    return {
      footer: `<${this.pullRequest.html_url}|View it on GitHub>`,
      footer_icon: 'https://assets-cdn.github.com/favicon.ico',
    };
  }
  getCommitSummaryAttachment() {
    const preText = action => `[${this.repository.full_name}] Pull request ${action} by ${this.pullRequest.user.login}`;
    const actionre = /\w+\.(\w+)/g; // e.g. match 'opened' for 'pull_request.opened'
    const action = actionre.exec(this.eventType);
    const pretext = preText(action[1]);
    return {
      pretext,
      fallback: pretext,
      color: this.getColor(),
      text: [
        `${this.pullRequest.commits} commit${this.pullRequest.commits !== 1 ? 's' : ''}`,
        `into \`${this.pullRequest.base.label}\``,
        `from \`${this.pullRequest.head.label}\``,
      ].join(' '),
      mrkdwn_in: ['text'],
    };
  }
  getMainAttachment() {
    const attachment = {
      color: this.getColor(),
      ...this.getAuthor(),
      ...this.getCore(),
      fields: this.getFields(),
      ts: this.createdAt.unix(),
      mrkdwn_in: ['text'],
      ...this.getFooter(),
    };

    // remove any keys where the value is null
    const cleanedAttachment = Object.assign(...Object.keys(attachment)
      .filter(key => attachment[key])
      .map(key => ({ [key]: attachment[key] })));
    return cleanedAttachment;
  }
  getRenderedMessage() {
    if (this.unfurl || !this.major[this.eventType]) {
      return {
        attachments: [
          this.getMainAttachment(),
        ],
      };
    }
    const attachments = [
      this.getCommitSummaryAttachment(),
      this.getMainAttachment(),
    ];

    // @todo if all pass, show one status summary attachment instead
    if (this.statuses) {
      const statuses = this.statuses.map((status) => {
        const newStatus = new Status(status);
        return newStatus.renderAttachment();
      });
      attachments.push(...statuses);
    }
    return {
      attachments,
    };
  }
}

// class Message {
//   constructor(GitHubObjectType, unfurl = false) {
//     this.gitHubObjectType = GitHubObjectType;
//     this.unfurl = unfurl;
//   }
//
//   renderAndGet() {
//     // need seperate logic in here for single unfurl attachment and multiple attachments
//     return {
//       attachments: [
//         this.attachment,
//       ],
//     };
//   }
//
// }

// TODO: /github test-run -> delivers all webhooks we're currently ready to receive

module.exports = {
  // Message,
  Issue,
  PullRequest,
  Status,
};
