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
  MAJOR_MESSAGES: {
    'pull_request.opened': true,
    'issues.opened': true,
  },
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
      color: getHexColorbyState(
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

// @todo: Extract and better deal with methods that could be static methods
class Issue extends AbstractIssue {
  constructor(
    issue,
    repository,
    eventType, // e.g. issues.opened
    unfurl = false,
  ) {
    super({
      abstractIssue: issue,
      repository,
      eventType,
      unfurl,
    }); // @todo: pass in object by ...spread

    this.issue = issue;
  }
  getFields() {
    // projects should be a field as well, but seems to not be easily available via API?
    if (!this.major) {
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

  getMainAttachment() {
    const attachment = {
      fields: this.getFields(),
      ...this.getBaseMessage(),
    };

    if (!this.unfurl) {
      const preText = this.getPreText('Issue');
      attachment.pretext = preText;
      attachment.fallback = preText;
    }

    // remove any keys where the value is null
    const cleanedAttachment = Object.assign(...Object.keys(attachment)
      .filter(key => attachment[key])
      .map(key => ({ [key]: attachment[key] })));
    return cleanedAttachment;
  }
  getRenderedMessage() {
    return {
      attachments: [
        this.getMainAttachment(),
      ],
    };
  }
}

class PullRequest extends AbstractIssue {
  // pre-text should always be in the first attachment
  constructor(
    pullRequest,
    repository,
    eventType, // e.g. pull_request.opened
    unfurl = false,
    statuses,
  ) {
    super({
      abstractIssue: pullRequest,
      repository,
      eventType,
      unfurl,
    }); // @todo: pass in object by ...spread

    this.pullRequest = pullRequest;
    this.statuses = statuses;
  }
  getFields() {
    // projects should be a field as well, but seems to not be easily available via API?
    if (!this.major) {
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
  getCommitSummaryAttachment() {
    const pretext = this.getPreText('Pull request');
    return {
      pretext,
      fallback: pretext,
      color: getHexColorbyState(
        this.abstractIssue.state,
        this.abstractIssue.merged,
      ),
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
      fields: this.getFields(),
      ...this.getBaseMessage(),
    };

    // remove any keys where the value is null
    const cleanedAttachment = Object.assign(...Object.keys(attachment)
      .filter(key => attachment[key])
      .map(key => ({ [key]: attachment[key] })));
    return cleanedAttachment;
  }
  getRenderedMessage() {
    if (this.unfurl) {
      return this.getMainAttachment();
    }

    if (!this.major) {
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
