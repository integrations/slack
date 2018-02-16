const { InstallGitHubApp } = require('../renderer/flow');

/**
 * Get the installation for the given account name
 */
module.exports = async function getInstallation(req, res, next) {
  const { robot, resource } = res.locals;
  const { Installation } = robot.models;

  req.log.trace({ resource }, 'Looking up installation');

  const [owner, installation] = await Installation.getByUsername(resource.owner);

  if (installation) {
    res.locals.installation = installation;
    next();
  } else {
    const info = await robot.info();

    res.json(new InstallGitHubApp(`${info.html_url}/installations/new/permissions?target_id=${owner.id}`));
  }
};
