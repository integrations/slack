const { AbstractIssue } = require('./AbstractIssue');
const { Status } = require('./Status');
const { arrayToFormattedString } = require('../../helpers');
const {
  constants,
} = require('./index.js');

class PullRequest extends AbstractIssue {
  // pre-text should always be in the first attachment
  constructor(
    constructorObject,
  ) {
    super({
      abstractIssue: constructorObject.pullRequest,
      repository: constructorObject.repository,
      eventType: constructorObject.eventType,
      unfurl: constructorObject.unfurl,
    }); // @todo: pass in object by ...spread

    this.pullRequest = constructorObject.pullRequest;
    this.statuses = constructorObject.statuses;
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

    return fields.filter(field => field.value)
      .map(field => ({ ...field, short: true }))
      .slice(0, constants.ATTACHMENT_FIELD_LIMIT);
  }
  getCommitSummaryAttachment() {
    const pretext = this.getPreText('Pull request');
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

module.exports = {
  PullRequest,
};
