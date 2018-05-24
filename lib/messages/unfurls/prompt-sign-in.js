const {
  Message,
} = require('..');

module.exports = class PromptSignIn extends Message {
  constructor(signInLink) {
    super({});
    this.signInLink = signInLink;
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      text: 'To see the rich preview, please connect your GitHub account. You will only have to do this once.',
      mrkdwn_in: ['text'],
      actions: [{
        type: 'button',
        text: 'Connect GitHub account',
        url: this.signInLink,
        style: 'primary',
      }],
    };
  }
};
