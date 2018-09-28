const supportLink = require('../../support-link');

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
    usage: 'close [issue link]',
    desc: 'Close an issue',
  },
  {
    usage: 'reopen [issue link]',
    desc: 'Reopen an Issue',
  },
  {
    usage: 'settings',
    desc: 'Adjust your settings in this workspace',
  },
  {
    usage: 'signin',
    desc: 'Connect your GitHub account',
  },
  {
    usage: 'help',
    desc: 'Show this help message',
  },
  {
    usage: 'open owner/repository',
    desc: 'Create a new issue',
  },
];

if (process.env.DEPLOY_COMMAND_ENABLED) {
  commands.push({
    usage: 'deploy owner/repository',
    desc: 'Trigger a deployment',
  });

  commands.push({
    usage: 'deploy owner/repository list',
    desc: 'List deployments of a repo',
  });
}

const { Message } = require('../../messages');

module.exports = class Help extends Message {
  constructor(command, subcommand) {
    super({
      footer: [
        '<https://github.com/integrations/slack#readme|Learn More>',
        `<${supportLink()}|Contact Support>`,
      ].join(' — '),
    });
    this.command = command;
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

    attachments.push({
      ...this.getBaseMessage(),
      text: '',
      color: '',
    });

    return {
      response_type: 'ephemeral',
      text: `:wave: Need some help with \`${this.command}\`?`,
      attachments,
    };
  }
};
