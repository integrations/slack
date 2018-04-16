module.exports = async (req, res) => {
  const { command } = res.locals;
  const {
    team_id,
    team_domain,
    user_id,
    channel_id,
    channel_name,
    text,
    enterprise_id,
    enterprise_name,
  } = req.body;
  await command.respond({
    response_type: 'ephemeral',
    attachments: [{
      title: 'Debug information',
      text: `\`\`\`${JSON.stringify({
        team_id,
        team_domain,
        user_id,
        channel_id,
        channel_name,
        text,
        enterprise_id,
        enterprise_name,
      }, null, 2)}\`\`\``,
    }],
  });
};
