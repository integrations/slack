const { Message } = require('..');

module.exports = class SignOut extends Message {
  constructor(signInLink, userSlackId) {
    super({});
    this.signInLink = signInLink;
    this.userSlackId = userSlackId;
  }

  toJSON() {
    return {
      response_type: 'ephemeral',
      attachments: [{
        ...this.getBaseMessage(),
        fallback: 'Your GitHub account has been disconnected.',
        text: `:white_check_mark: <@${this.userSlackId}> is disconnected from your GitHub account\n` +
          'Features like subscriptions and unfurls will stop working. ' +
          'To re-connect your GitHub account click the button below.',
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
