const {
  Message,
} = require('../index');

module.exports = class UnfurlSettingsUnmuteConfirm extends Message {
  constructor() {
    super({});
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      text: ':white_check_mark: Prompts to show a rich preview have been unmuted',
    };
  }
};
