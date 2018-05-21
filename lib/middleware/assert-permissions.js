const { GitHubAppPermissionUpdate } = require('../messages/flow');

module.exports = permissions => (req, res, next) => {
  const { command, installation } = res.locals;

  const hasPermissions = Object.keys(permissions).every(key => (
    permissions[key] === installation.permissions[key]
  ));

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
