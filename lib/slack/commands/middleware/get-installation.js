const GitHub = require('github');

const { InstallGitHubApp } = require('../../renderer/flow');

/**
 * Get the installation for the given account name
 */
module.exports = async function getInstallation(req, res, next) {
  const { robot, resource } = res.locals;
  const { Installation } = robot.models;

  req.log.trace({ resource }, 'Looking up installation');

  // FIXME: need an anuthenticated client, but authenticating as app doesn't work
  // const github = await robot.auth();
  const github = new GitHub();

  let owner;

  try {
    owner = (await github.orgs.get({ org: resource.owner })).data;
  } catch (err) {
    owner = (await github.users.getForUser({ username: resource.owner })).data;
  }

  const installation = await Installation.getForOwner(owner.id);

  if (installation) {
    res.locals.installation = installation;
    next();
  } else {
    const info = await robot.info();

    res.json(new InstallGitHubApp(`${info.html_url}/installations/new/permissions?target_id=${owner.id}`));
  }
};
