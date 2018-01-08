const ErrorMessage = require('./error-message');

module.exports = class NotFound extends ErrorMessage {
  constructor(subscribeInput) {
    super({});
    this.subscribeInput = subscribeInput;
  }

  toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = `Could not find resource: \`${this.subscribeInput}\``;
    return message;
  }
};
