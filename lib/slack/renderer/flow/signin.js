const { Message } = require('../../renderer');

module.exports = class SignIn extends Message {
  constructor({ signInLink }) {
    super({});
    this.signInLink = signInLink;
  }

  toJSON() {
    return {
      response_type: 'ephemeral',
      attachments: [{
        ...this.getBaseMessage(),
        text: `<${this.signInLink}|Finish connecting your GitHub account>`,
      }],
    };
  }
};
