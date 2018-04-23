const {
  Message,
} = require('..');

module.exports = class PrivateUnfurlPrompt extends Message {
  constructor(unfurl) {
    super({});
    this.unfurl = unfurl;
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      title: `Do you want to show a rich preview for ${this.unfurl.url}?`,
      text: 'The link you shared is private, so not everyone in this workspace may have access to it.',
      callback_id: `unfurl-${this.unfurl.id}`,
      actions: [
        {
          name: 'unfurl',
          text: 'Show rich preview',
          type: 'button',
          style: 'primary',
        },
        {
          name: 'unfurl-dismiss',
          text: 'Dismiss',
          type: 'button',
        },
      ],
    };
  }
};
