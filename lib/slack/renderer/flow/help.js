// FIXME: make this dynamic
const commands = [
  {
    usage: 'subscribe owner/repository',
    desc: 'Subscribe to notifications for a repository',
  },
  {
    usage: 'unsubscribe owner/repository',
    desc: 'Unsubscribe to notifications for a repository',
  },
  {
    usage: 'subscribe list',
    desc: 'List all active subscriptions in a channel',
  },
  {
    usage: 'signin',
    desc: 'Connect your GitHub account',
  },
  {
    usage: 'help',
    desc: 'Show this help message',
  },
];

const { Message } = require('../../renderer');

module.exports = class Help extends Message {
  constructor(command) {
    super({});
    this.command = command;
  }

  toJSON() {
    const attachments = commands.map(command => ({
      text: `${command.desc}:\n\`${this.command} ${command.usage}\``,
      mrkdwn_in: ['text'],
    }));

    return {
      response_type: 'ephemeral',
      text: `:wave: Need some help with \`${this.command}\`?`,
      attachments,
    };
  }
};
