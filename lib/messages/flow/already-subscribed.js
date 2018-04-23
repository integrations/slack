const ErrorMessage = require('./error-message');

module.exports = class AlreadySubscribed extends ErrorMessage {
  constructor(subscribeInput) {
    super();
    this.subscribeInput = subscribeInput;
  }

  toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = `You're already subscribed to \`${this.subscribeInput}\``;
    return message;
  }
};
