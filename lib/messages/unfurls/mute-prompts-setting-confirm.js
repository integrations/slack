const {
  Message,
} = require('..');

module.exports = class MutePromptsSettingConfirm extends Message {
  constructor(timePeriod) {
    super({});
    this.timePeriod = timePeriod;
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      text: `Prompts are muted ${this.timePeriod} :white_check_mark:\n` +
        'You can adjust this setting by invoking `/github settings`',
      mrkdwn_in: ['text'],
    };
  }
};
