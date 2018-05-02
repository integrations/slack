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
        text: `:white_check_mark: <@${this.userSlackId}> is now signed out\n` +
          'Features like subscriptions and rich link previews will stop working. ' +
          'Use `/github signin` to sign back into your GitHub account at any time (or click the button below).',
        mrkdwn_in: ['text'],
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
