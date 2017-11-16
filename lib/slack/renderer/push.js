const { Message } = require('../../slack/renderer');

class Push extends Message {
  constructor({ push }) {
    super({
      footer: `<${push.repository.html_url}|${push.repository.full_name}`,
      includeAuthor: true,
      author: {
        login: push.sender.login,
        avatarURL: push.sender.avatar_url,
        htmlURL: push.sender.html_url,
      },
    });
    this.push = push;
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
