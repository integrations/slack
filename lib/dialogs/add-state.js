module.exports = (dialog, channel, resource) => {
  const state = JSON.stringify({ resource, channel });
  return { state, ...dialog };
};
