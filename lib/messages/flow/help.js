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

const { Message } = require('../../messages');

module.exports = class Help extends Message {
  constructor(command, subcommand) {
    super({});
    this.command = `/${command}`;
    this.subcommand = subcommand;
  }

  filterForSubCommand(command) {
    if (!this.subcommand) {
      return true;
    }
    return command.usage.includes(this.subcommand);
  }

  toJSON() {
    const attachments = commands
      .filter(command => this.filterForSubCommand(command))
      .map(command => ({
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
