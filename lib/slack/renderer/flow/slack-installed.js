const { Message } = require('../');

module.exports = class SlackInstalled extends Message {
  constructor() {
    super({});
  }
  toJSON() {
    const subscribe = 'You\'ve successfully installed GitHub on this Slack workspace :tada:\n' +
    'To subscribe a channel to a repository use the following slash command:\n' +
    '/github subscribe owner/repository\n';
    // const unfurl = 'Rich links to content on GitHub will start working automatically' +
    // ', for example:\nhttps://github.com/probot/probot/blob/master/lib/robot.js#L86-L90';
    return {
      attachments: [
        {
          ...this.getBaseMessage(),
          text: subscribe,
        },
        // {
        //   ...this.getBaseMessage(),
        //   text: unfurl,
        // },
      ],
    };
  }
};
