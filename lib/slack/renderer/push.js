const { Message } = require('../../slack/renderer');

class Push extends Message {
  constructor(constructorObject) {
    super({
      includeFooter: true,
      footerURL: constructorObject.push.compare,
      includeAuthor: true,
      author: {
        login: constructorObject.push.sender.login,
        avatarURL: constructorObject.push.sender.avatar_url,
        htmlURL: constructorObject.push.sender.html_url,
      },
    });
    this.push = constructorObject.push;
  }

  getCore() {
    const noOfCommits = this.push.commits.length;
    const commits = noOfCommits === 1 ? 'commit' : 'commits';
    const branch = `\`${this.push.ref.replace('refs/heads/', '')}\``;
    const pushed = this.push.forced ? 'force-pushed' : 'pushed';
    const text = `${noOfCommits} new ${commits} ${pushed} to ${branch}`;
    return {
      fallback: text,
      text,
    };
  }

  getRenderedMessage() {
    return {
      attachments: [
        {
          ...super.getBaseMessage(),
          ...this.getCore(),
          mrkdwn_in: ['text'],
        },
      ],
    };
  }
}

module.exports = {
  Push,
};
