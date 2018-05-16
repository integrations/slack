const { postQuickActions } = require('../quick-actions');

module.exports = async (req, res) => {
  const {
    slackUser,
    slackWorkspace,
    command,
    robot,
  } = res.locals;
  const { channel_id } = res.locals.command;
  // Just filter out team, user, response url, etc. and pass to another module

  await postQuickActions({
    slackUser,
    slackWorkspace,
    channelId:
    channel_id,
    command,
    robot,
  });

  return res.send();
};
