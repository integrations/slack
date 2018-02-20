const { Message } = require('../');

module.exports = class SlackInstalled extends Message {
  constructor() {
    super({});
  }
  toJSON() {
    const subscribe = 'You\'ve successfully installed GitHub on this Slack workspace :tada:\n' +
    'To subscribe a channel to a repository use the following slash command:\n' +
    '/github subscribe owner/repository\n';
    const help = 'Looking for additional help? Try /github help';
    return {
      attachments: [
        {
          ...this.getBaseMessage(),
          text: subscribe,
          fallback: subscribe,
        },
        {
          ...this.getBaseMessage(),
          text: help,
          fallback: help,
        },
      ],
    };
  }
};
