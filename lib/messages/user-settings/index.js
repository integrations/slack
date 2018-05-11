const moment = require('moment');

const {
  Message,
} = require('../index');

const UnfurlAutoSettingsForRepo = require('./unfurl-auto-settings-for-repo');
const UnfurlAutoSettingsRemoveConfirm = require('./unfurl-auto-settings-remove-confirm');
const UnfurlSettingsUnmuteConfirm = require('./unfurl-settings-unmute-confirm');

class CombinedSettings extends Message {
  constructor({ muteUnfurlPromptsUntil, muteUnfurlPromptsIndefinitely, autoUnfurlRepos }) {
    super({});
    this.muteUnfurlPromptsUntil = muteUnfurlPromptsUntil;
    this.muteUnfurlPromptsIndefinitely = muteUnfurlPromptsIndefinitely;
    this.autoUnfurlRepos = autoUnfurlRepos;
  }

  getAttachments() {
    const attachments = [];
    if (this.autoUnfurlRepos) {
      attachments.push({
        ...super.getBaseMessage(),
        title: 'Automatic rich previews',
        text: `Links you post linking to ${this.autoUnfurlRepos.length} private repositor${this.autoUnfurlRepos.length === 1 ? 'y' : 'ies'} automatically get a rich preview. Select a repository to adjust its settings.`,
        callback_id: 'unfurl-settings-auto',
        actions: [{
          name: 'get-settings-for-repo',
          text: 'Select a repository',
          type: 'select',
          options: this.autoUnfurlRepos.map(repository => ({
            text: repository.full_name,
            value: `${repository.id}|${repository.full_name}`,
          })),
        }],
      });
    }

    if (this.muteUnfurlPromptsUntil || this.muteUnfurlPromptsIndefinitely) {
      attachments.push({
        ...super.getBaseMessage(),
        title: 'Muted prompts to show rich preview',
        text: `Prompts to show a rich preview are muted ${this.muteUnfurlPromptsIndefinitely ? 'indefinitely' : `for ${moment.unix(this.muteUnfurlPromptsUntil).toNow(true)}`}`,
        callback_id: 'unfurl-settings',
        actions: [{
          name: 'unmute-prompts',
          text: 'Unmute',
          type: 'button',
        }],
      });
    }

    if (attachments.length === 0) {
      attachments.push({
        ...super.getBaseMessage(),
        text: 'You do not have any settings configured.',
      });
    }
    return attachments;
  }
}

module.exports = {
  CombinedSettings,
  UnfurlAutoSettingsForRepo,
  UnfurlAutoSettingsRemoveConfirm,
  UnfurlSettingsUnmuteConfirm,
};
