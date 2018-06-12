const { Message } = require('.');

function shortSha(sha) {
  return sha.substring(0, 8);
}

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
      return `<${commit.url}|\`${shortSha(commit.id)}\`> - ${message}`;
    }).join('\n');
  }

  get summary() {
    const noOfCommits = this.push.commits.length;
    const commits = noOfCommits === 1 ? 'commit' : 'commits';
    const branch = this.push.ref.replace('refs/heads/', '');
    const branchUrl = `${this.push.repository.html_url}/tree/${branch}`;

    if (noOfCommits === 0 && this.push.forced) {
      const before = shortSha(this.push.before);
      const after = shortSha(this.push.after);
      return `force-pushed the <${branchUrl}|\`${branch}\`> branch from \`${before}\` to \`${after}\``;
    }

    const pushed = this.push.forced ? 'force-pushed' : 'pushed';
    return `<${this.push.compare}|${noOfCommits} new ${commits}> ${pushed} to <${branchUrl}|\`${branch}\`>`;
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
