const { Message, getChannelString } = require('..');

module.exports = class PromptToInviteApp extends Message {
  constructor(channel) {
    super({});
    this.channel = getChannelString(channel);
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      fallback: 'Invite @github to your channel',
      text: 'To receive these prompts in the channel where you shared the ' +
        `link${this.channel ? ` (${this.channel})` : ''}, add GitHub to the conversation using /invite @github`,
      mrkdwn_in: ['text'],
    };
  }
};
