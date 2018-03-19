const { Message } = require('../..');

module.exports = class UnfurlSignIn extends Message {
  constructor(signInLink) {
    super({});
    this.signInLink = signInLink;
  }

  getAttachment() {
    const text = 'Connect your GitHub account to see rich previews of GitHub links';
    return {
      ...this.getBaseMessage(),
      fallback: text,
      text,
      callback_id: 'unfurl-settings',
      actions: [
        {
          type: 'button',
          text: 'Connect GitHub account',
          url: this.signInLink,
          style: 'primary',
        },
        {
          name: 'dont-remind',
          text: 'Don\'t remind me again',
          type: 'button',
        },
      ],
    };
  }
};
