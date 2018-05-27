async function get(req, res) {
  const { gitHubUser } = res.locals;
  const users = await gitHubUser.client.users.get({});

  let repos = await gitHubUser.client.repos.getForUser({ username: users.data.login });
  repos = repos.data;

  const options = repos.map(repo => ({
    label: repo.full_name,
    value: repo.id,
  }));

  return res.send({ options });
}

module.exports = {
  get,
};
