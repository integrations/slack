const ErrorMessage = require('../flow/error-message');

module.exports = class NoSubscriptionsError extends ErrorMessage {
  getAttachment() {
    const message = this.getErrorMessage();
    message.attachments[0].text = 'This channel is not subscribed to any repositories';
    return message;
  }
};
