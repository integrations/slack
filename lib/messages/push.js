const { Message } = require('.');

class Push extends Message {
  constructor({ push }) {
    super({
      footer: `<${push.repository.html_url}|${push.repository.full_name}>`,
      author: {
        login: push.sender.login,
        avatarURL: push.sender.avatar_url,
        htmlURL: push.sender.html_url,
      },
    });
    this.push = push;
  }

  get commits() {
    return this.push.commits.map((commit) => {
      const message = commit.message.split('\n')[0];
      const sha = commit.id.substring(0, 8);
      return `<${commit.url}|\`${sha}\`> - ${message}`;
    }).join('\n');
  }

  get summary() {
    const noOfCommits = this.push.commits.length;
    const commits = noOfCommits === 1 ? 'commit' : 'commits';
    const branch = `\`${this.push.ref.replace('refs/heads/', '')}\``;
    const pushed = this.push.forced ? 'force-pushed' : 'pushed';
    const text = `<${this.push.compare}|${noOfCommits} new ${commits}> ${pushed} to ${branch}`;
    return text;
  }

  getRenderedMessage() {
    return {
      attachments: [
        {
          ...super.getBaseMessage(),
          fallback: `[${this.push.repository.full_name}] ${this.summary}`,
          text: `*${this.summary}*\n${this.commits}`,
          mrkdwn_in: ['text'],
        },
      ],
    };
  }
}

module.exports = {
  Push,
};
