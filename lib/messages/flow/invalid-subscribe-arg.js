const ErrorMessage = require('./error-message');

module.exports = class InvalidSubscribeArg extends ErrorMessage {
  constructor(subscribeInput) {
    super();
    this.subscribeInput = subscribeInput;
  }

  toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = `\`${this.subscribeInput}\` is not a valid argument.`;
    return message;
  }
};
