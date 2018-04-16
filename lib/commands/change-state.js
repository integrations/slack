module.exports = async (state, req, res) => {
  const { resource, gitHubUser, command } = res.locals;

  await gitHubUser.client.issues.edit({
    owner: resource.owner,
    repo: resource.repo,
    number: resource.number,
    state,
  });

  return command.respond({ response_type: 'in_channel' });
};
