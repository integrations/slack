const { Message } = require('../../renderer');

class SignInMessage extends Message {
  constructor({ signInlink }) {
    super({});
    this.signInlink = signInlink;
  }

  getRenderedMessage() {
    return {
      response_type: 'ephemeral',
      attachments: [{
        ...this.getBaseMessage(),
        text: `<${this.signInlink}|Finish connecting your GitHub account>`,
      }],
    };
  }
}

module.exports = {
  SignInMessage,
};
