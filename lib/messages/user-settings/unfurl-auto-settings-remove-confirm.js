const {
  Message,
} = require('../index');

module.exports = class UnfurlAutoSettingsRemoveConfirm extends Message {
  constructor(repoNameWithOwner) {
    super({});
    this.repoNameWithOwner = repoNameWithOwner;
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      text: `:white_check_mark: Links you post to \`${this.repoNameWithOwner}\` will no longer receive automatic rich previews.`,
      mrkdwn_in: ['text'],
    };
  }
};
