module.exports = function hasEarlyAccess({ channelId, teamId }) {
  if (channelId && process.env.EARLY_ACCESS_CHANNELS) {
    if (channelId && process.env.EARLY_ACCESS_CHANNELS.split(',').includes(channelId)) {
      return true;
    }
  }
  if (teamId && process.env.EARLY_ACCESS_WORKSPACES) {
    if (teamId && process.env.EARLY_ACCESS_WORKSPACES.split(',').includes(teamId)) {
      return true;
    }
  }
  return false;
};
