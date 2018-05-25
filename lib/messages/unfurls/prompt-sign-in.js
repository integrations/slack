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
      text: 'To verify your access to the rich preview content, please connect your GitHub account. You only have to do this once.',
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
