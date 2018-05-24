const ErrorMessage = require('./error-message');

module.exports = class NotFound extends ErrorMessage {
  constructor(resource) {
    super();
    this.resource = resource;
  }

  toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = `Could not find resource: \`${this.resource}\``;
    return message;
  }
};
