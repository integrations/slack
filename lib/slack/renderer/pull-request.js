const { AbstractIssue } = require('./abstract-issue');
const { Status } = require('./status');
const { arrayToFormattedString } = require('../../helpers');

class PullRequest extends AbstractIssue {
  // pre-text should always be in the first attachment
  constructor({
    pullRequest,
    repository,
    eventType,
    unfurlType,
    sender,
    statuses,
  }) {
    super({
      abstractIssue: pullRequest,
      repository,
      eventType,
      unfurlType,
      sender,
    });

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
    ];
    if (this.pullRequest.milestone) {
      fields.push({
        title: 'Milestone',
        value: `<${this.pullRequest.milestone.html_url}|${this.pullRequest.milestone.title}>`,
      });
    }

    return this.constructor.cleanFields(fields);
  }
  getCommitSummaryAttachment() {
    const pretext = this.getPreText('Pull request', this.abstractIssue.merged);
    return {
      pretext,
      fallback: pretext,
      color: this.constructor.getHexColorbyState(
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
    if (this.unfurlType) {
      return this.getMainAttachment();
    }

    if (!this.major) {
      const message = {
        attachments: [
          this.getMainAttachment(),
        ],
      };
      message.attachments[0].pretext = this.getPreText(
        'Pull request',
        this.abstractIssue.merged,
      );
      return message;
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

module.exports = {
  PullRequest,
};
