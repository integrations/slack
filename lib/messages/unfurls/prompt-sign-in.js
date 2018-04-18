const {
  Message,
} = require('..');

module.exports = class PromptSignIn extends Message {
  constructor() {
    super({});
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      text: 'Get a rich preview for the link you posted by connecting your GitHub account using `/github signin`',
      mrkdwn_in: ['text'],
    };
  }
};
