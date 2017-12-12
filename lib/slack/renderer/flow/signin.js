const { Message } = require('../../renderer');

module.exports = class SignIn extends Message {
  constructor(signInLink) {
    super({});
    this.signInLink = signInLink;
  }

  toJSON() {
    const finish = 'Finish connecting your GitHub account';
    return {
      response_type: 'ephemeral',
      attachments: [{
        ...this.getBaseMessage(),
        fallback: finish,
        text: finish,
        actions: [{
          type: 'button',
          text: 'Connect GitHub account',
          url: this.signInLink,
          style: 'primary',
        }],
      }],
    };
  }
};
