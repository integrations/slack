const ErrorMessage = require('../flow/error-message');

module.exports = class DialogSubmissionError extends ErrorMessage {
  constructor(errorMessage, submission, appUrl, resource) {
    super();
    this.errorMessage = errorMessage;
    this.submission = submission;
    this.appUrl = appUrl;
    this.resource = resource;
  }

  toJSON() {
    const message = this.getErrorMessage();
    Object.assign(message.attachments[0], {
      title: `Error: ${this.errorMessage}`,
      fields: Object.keys(this.submission).map(field => ({
        title: field,
        value: `\`\`\`${this.submission[field]}\`\`\``,
      })),
      mrkdwn_in: ['fields', 'text'],
    });

    if (this.resource && this.appUrl) {
      Object.assign(message.attachments[0], {
        text: `Please make sure you have <${this.appUrl}/installations/new|installed the Slack app> on \`${this.resource.owner}/${this.resource.repo}\` and then try again`,
      });
    }
    return message;
  }
};
