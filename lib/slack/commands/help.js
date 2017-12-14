// FIXME: make this dynamic
const commands = [
  {
    usage: 'subscribe owner/repository',
    desc: 'Subscribe to notifications for a repository',
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

module.exports = async (req, res) => {
  const attachments = commands.map(command => ({
    text: `${command.desc}:\n\`${req.body.command} ${command.usage}\``,
    mrkdwn_in: ['text'],
  }));


  res.json({
    response_type: 'ephemeral',
    text: ':wave: Need some help with `/github`?',
    attachments,
  });
};
