const ErrorMessage = require('./error-message');

module.exports = class NotSubscribed extends ErrorMessage {
  constructor(subscribeInput) {
    super();
    this.subscribeInput = subscribeInput;
  }

  toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = "You're not currently subscribed to " +
      `\`${this.subscribeInput}\`\nUse \`/github subscribe ${this.subscribeInput}\` to subscribe.`;
    return message;
  }
};
