const { Message } = require('../../renderer');

class SignInMessage extends Message {
  constructor({ signInLink }) {
    super({});
    this.signInLink = signInLink;
  }

  getRenderedMessage() {
    return {
      response_type: 'ephemeral',
      attachments: [{
        ...this.getBaseMessage(),
        text: `<${this.signInLink}|Finish connecting your GitHub account>`,
      }],
    };
  }
}

module.exports = {
  SignInMessage,
};
