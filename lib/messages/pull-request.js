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
    checkRuns,
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
    this.checkRuns = checkRuns;
    this.reviews = reviews;

    this.totalNumberOfStatuses = (statuses || []).length + (checkRuns || []).length;

    this.unsuccessfulStatuses = [];
    this.successfulStatuses = [];

    if (statuses) {
      this.unsuccessfulStatuses.push(...statuses.filter(status => status.state !== 'success'));
      this.successfulStatuses.push(...statuses.filter(status => status.state === 'success'));
    }

    if (checkRuns) {
      this.unsuccessfulStatuses.push(...checkRuns.filter(checkRun =>
        checkRun.conclusion !== 'success' &&
        checkRun.conclusion !== 'neutral'));
      this.successfulStatuses.push(...checkRuns.filter(checkRun =>
        checkRun.conclusion === 'success' ||
        checkRun.conclusion === 'neutral'));
    }
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
        reviewers.add(`@${user.login}`);
      });
    }
    if (this.pullRequest.requested_teams) {
      this.pullRequest.requested_teams.forEach((team) => {
        reviewers.add(`@${this.repository.owner.login}/${team.slug}`);
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

    // 3 cases: none or one successful, some successful, all successful

    // if there is one and it is successful, show
    if (this.successfulStatuses.length === 1 && this.totalNumberOfStatuses === 1) {
      attachments.push(...this.successfulStatuses.map(status =>
        new Status(status).renderAttachment()));
    }

    // always show all unsuccessfuls
    attachments.push(...this.unsuccessfulStatuses.map(status =>
      new Status(status).renderAttachment()));

    // render the message, "{n/m} succesful checks"
    if (this.totalNumberOfStatuses > 1) {
      attachments.push(Status.getChecksPassAttachment(
        this.totalNumberOfStatuses - this.unsuccessfulStatuses.length,
        this.totalNumberOfStatuses,
      ));
    }

    return {
      attachments,
    };
  }
}

module.exports = {
  PullRequest,
};
