const { GitHubAppPermissionUpdate } = require('../messages/flow');

module.exports = async permissions => (req, res, next) => {
  const { command, installation, robot, resource } = res.locals;
  const { owner, repo } = resource
  
  const hasPermissions = installation.assertPermissions(await robot.auth(), { owner, repo, permissions })

  req.log.trace({
    installation,
    expected: permissions,
    actual: installation.permissions,
    hasPermissions,
  }, 'Verifying permissions for installation');

  if (!hasPermissions) {
    return command.respond(new GitHubAppPermissionUpdate({ installation }));
  }

  next();
};
