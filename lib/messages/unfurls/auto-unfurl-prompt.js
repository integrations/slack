const {
  Message,
} = require('..');

module.exports = class AutoUnfurlPrompt extends Message {
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
      callback_id: `unfurl-auto-${this.unfurl.githubRepoId}|${this.owner}/${this.repo}`,
      text: `You can enable automatic previews for *private* links to ${this.owner}/${this.repo} that *you* post either to this channel or to all channels in the \`${this.team.domain}\` workspace.`,
      title: `Done! Want to automatically show rich previews for ${this.owner}/${this.repo}?`,
      mrkdwn_in: [
        'text',
      ],
      actions: [
        {
          name: 'this-channel',
          style: 'primary',
          text: 'Enable for this channel',
          type: 'button',
        },
        {
          name: 'all-channels',
          text: 'Enable for all channels',
          type: 'button',
        },
        {
          name: 'cancel',
          text: 'Always prompt me',
          type: 'button',
        },
      ],
    };
  }
};
