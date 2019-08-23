const supportLink = require('../../support-link');

// FIXME: make this dynamic
const commands = [
  {
    usage: 'subscribe owner/repository',
    desc: 'Subscribe to notifications for a repository',
  },
  {
    usage: 'unsubscribe owner/repository',
    desc: 'Unsubscribe from notifications for a repository',
  },
  {
    usage: 'subscribe owner',
    desc: 'Subscribe to notifications for all repositories in an organization',
  },
  {
    usage: 'unsubscribe owner',
    desc: 'Unsubscribe from notifications for an organization',
  },
  {
    usage: 'subscribe owner/repository reviews,comments',
    desc: 'Subscribe to additional features and adjust the configuration of your subscription (<https://github.com/integrations/slack#configuration|Learn more>)',
  },
  {
    usage: 'unsubscribe owner/repository commits',
    desc: 'Unsubscribe from one or more subscription features',
  },
  {
    usage: 'subscribe owner/repository +label:my-label',
    desc: 'Create required-label. Issues, Comments, PRs without that label will be ignored.',
  },
  {
    usage: 'unsubscribe owner/repository +label:my-label',
    desc: 'Remove required-label.',
  },
  {
    usage: 'subscribe list',
    desc: 'List all active subscriptions in a channel',
  },
  {
    usage: 'subscribe list features',
    desc: 'List all active subscriptions with subscription features',
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
  constructor(command, subcommand, additionalAttachments) {
    super({
      footer: [
        '<https://github.com/integrations/slack#readme|Learn More>',
        `<${supportLink()}|Contact Support>`,
      ].join(' — '),
    });
    this.command = command;
    this.subcommand = subcommand;
    this.additionalAttachments = additionalAttachments;
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

    if (this.additionalAttachments) {
      attachments.push(...this.additionalAttachments);
    }

    return {
      response_type: 'ephemeral',
      text: `:wave: Need some help with \`${this.command}\`?`,
      attachments,
    };
  }
};
