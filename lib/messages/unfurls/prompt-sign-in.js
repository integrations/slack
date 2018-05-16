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
      text: 'Get a rich preview for the link you posted by connecting your GitHub account',
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
