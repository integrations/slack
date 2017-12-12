const { Message } = require('../../renderer');

module.exports = class ErrorMessage extends Message {
  constructor() {
    super({});
  }

  getErrorMessage() {
    return {
      response_type: 'ephemeral',
      attachments: [{
        ...this.getBaseMessage(),
        color: 'danger',
        mrkdwn_in: ['text'],
      }],
    };
  }
};
