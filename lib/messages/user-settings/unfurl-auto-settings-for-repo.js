const {
  Message,
} = require('../index');

module.exports = class UnfurlAutoSettingsForRepo extends Message {
  constructor(actionValue, slackUser) {
    super({});
    const [repoId, repoNameWithOwner] = actionValue.split('|');
    this.repoId = repoId;
    this.repoNameWithOwner = repoNameWithOwner;

    const channels = slackUser.settings.unfurlPrivateResources[repoId];
    this.channelText = channels.includes('all') ? 'all channels.' : `the following channels:${channels.map(channel => `\n<#${channel}>`)}`;
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      title: 'Automatic rich previews',
      text: `Links you post linking to \`${this.repoNameWithOwner}\` automatically get a rich preview in ${this.channelText}`,
      callback_id: 'unfurl-settings-auto',
      actions: [{
        name: 'remove-repo',
        type: 'button',
        style: 'danger',
        text: 'Disable automatic rich previews',
        value: `${this.repoId}|${this.repoNameWithOwner}`,
        confirm: {
          title: 'Are you sure?',
          text: `This will disable automatic rich previews for links you post linking to \`${this.epoNameWithOwner}\` in *all* channels`,
          ok_text: 'Yes',
          dismiss_text: 'Cancel',
        },
      }],
    };
  }
};
