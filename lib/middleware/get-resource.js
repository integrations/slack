const githubUrl = require('../github-url');

const { InvalidUrl } = require('../messages/flow');

/**
 * Looks up the GitHub resource that is being referenced in a command.
 */
module.exports = function getResource(req, res, next) {
  const { command } = res.locals;
  const url = command.args[0];

  // Turn the argument into a resource
  const resource = githubUrl(url);

  if (resource /* && resource.type === 'repo' */) {
    res.locals.resource = resource;
    next();
  } else {
    return command.respond(new InvalidUrl(url));
  }
};
