module.exports = state => async (req, res) => {
  const { gitHubUser, command } = res.locals;
  const { owner, repo, number } = res.locals.resource;

  await gitHubUser.client.issues.edit({
    owner, repo, number, state,
  });

  return command.respond({ response_type: 'in_channel' });
};
