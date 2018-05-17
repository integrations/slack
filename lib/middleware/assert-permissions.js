const { GitHubAppPermissionUpdate } = require('../messages/flow');

module.exports = permissions => (req, res, next) => {
  const { command, installation } = res.locals;

  req.log.trace({
    installation,
    expected: permissions,
    actual: installation.permissions,
  }, 'Verifying permissions for installation');

  const hasPermissions = Object.keys(permissions).every((key) => {
    console.log('WAT?', permissions[key], installation.permissions[key], permissions[key] === installation.permissions[key]);
    return permissions[key] === installation.permissions[key];
  });

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
