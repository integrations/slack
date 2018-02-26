const { Message } = require('..');

module.exports = class ErrorMessage extends Message {
  constructor() {
    super({});
  }

  getErrorMessage() {
    return {
      attachments: [{
        ...this.getBaseMessage(),
        color: 'danger',
        mrkdwn_in: ['text'],
      }],
      response_type: 'ephemeral',
    };
  }
};
