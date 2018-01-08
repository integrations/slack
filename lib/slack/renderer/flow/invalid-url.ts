const ErrorMessage = require('./error-message');

module.exports = class InvalidUrl extends ErrorMessage {
  constructor(subscribeInput) {
    super({});
    this.subscribeInput = subscribeInput;
  }

  toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = `\`${this.subscribeInput}\` does not appear to be a GitHub link.`;
    return message;
  }
};
