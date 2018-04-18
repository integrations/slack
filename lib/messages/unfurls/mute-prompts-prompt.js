const {
  Message,
} = require('..');

module.exports = class MutePromptsPrompt extends Message {
  constructor(owner, repo, unfurl, team) {
    super({});
    this.owner = owner;
    this.repo = repo;
    this.unfurl = unfurl;
    this.team = team;
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      callback_id: 'unfurl-mute-prompts',
      title: 'Getting too many prompts?',
      actions: [
        {
          name: 'mute-24h',
          text: 'Mute prompts for 24h',
          type: 'button',
        },
        {
          name: 'mute-indefinitely',
          text: 'Mute prompts indefinitely',
          type: 'button',
        },
        {
          name: 'cancel',
          text: 'Cancel',
          type: 'button',
        },
      ],
    };
  }
};
