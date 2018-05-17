const supportLink = require('../../support-link');

module.exports = class Exception {
  constructor(errorCode, command) {
    this.link = supportLink({
      comments: `Tell us a little more about what happened and include the error code and metadata below.\n\nError code: ${errorCode}\n\n` +
        'Slack metadata:\n' +
        `Team: ${command.team_id}\n` +
        `User: ${command.user_id}\n` +
        `Channel: ${command.channel_id}\n` +
        `Command: ${command.command} ${command.subcommand} ${command.text}`,
    });
  }

  toJSON() {
    return {
      response_type: 'ephemeral',
      attachments: [
        {
          text: 'Sorry, we had trouble with your request! If this is ' +
            `interfering with your work, please <${this.link}|get in touch>!`,
          color: 'danger',
          mrkdwn_in: ['text'],
        },
      ],
    };
  }
};
