const {
  Message,
} = require('..');

module.exports = class AutoUnfurlSettingConfirm extends Message {
  constructor(repoNameWithOwner, anyChannel) {
    super({});
    this.repoNameWithOwner = repoNameWithOwner;
    if (anyChannel) {
      this.anyChannel = 'in any channel of this workspace ';
    } else {
      this.anyChannel = 'in this channel ';
    }
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      text: `Links to \`${this.repoNameWithOwner}\` that you post ${this.anyChannel}will automatically have a rich preview :white_check_mark:`,
      mrkdwn_in: ['text'],
    };
  }
};
