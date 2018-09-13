const { AbstractIssue } = require('./abstract-issue');
const { Status } = require('./status');
const { arrayToFormattedString } = require('../helpers');

class PullRequest extends AbstractIssue {
  // pre-text should always be in the first attachment
  constructor({
    pullRequest,
    repository,
    eventType,
    unfurlType,
    sender,
    statuses,
    reviews,
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
    this.reviews = reviews;
  }

  get identifier() {
    return `issue#${this.issue.id}`;
  }

  getFields() {
    // projects should be a field as well, but seems to not be easily available via API?
    if (!this.major) {
      return null;
    }
    const reviewers = new Set();
    if (this.reviews) {
      this.reviews.forEach((review) => {
        reviewers.add(review.user.login);
      });
    }
    if (this.pullRequest.requested_reviewers) {
      this.pullRequest.requested_reviewers.forEach((user) => {
        reviewers.add(user.login);
      });
    }
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
        title: 'Reviewers',
        value: Array.from(reviewers).join(', '),
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
  getMainAttachment() {
    const attachment = {
      fields: this.getFields(),
      ...this.getBaseMessage(),
    };
    if (!this.unfurlType) {
      attachment.pretext = this.getPreText('Pull request', this.abstractIssue.merged);
    }

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
      return {
        attachments: [
          this.getMainAttachment(),
        ],
      };
    }

    const attachments = [
      this.getMainAttachment(),
    ];
    if (this.statuses) {
      // 3 cases: none or one successful, some successful, all successful
      const successfulStatuses = this.statuses.filter(status => status.state === 'success');
      switch (successfulStatuses.length) {
        case 0:
        case 1:
          attachments.push(...this.statuses.map(status => new Status(status).renderAttachment()));
          break;
        case this.statuses.length:
          attachments.push(Status.getChecksPassAttachment(
            successfulStatuses.length,
            this.statuses.length,
          ));
          break;
        default:
          attachments.push(...this.statuses.filter(status => status.state !== 'success')
            .map(status => new Status(status).renderAttachment()));
          attachments.push(Status.getChecksPassAttachment(
            successfulStatuses.length,
            this.statuses.length,
          ));
      }
    }
    return {
      attachments,
    };
  }
}

module.exports = {
  PullRequest,
};
