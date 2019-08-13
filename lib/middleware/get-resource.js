const githubUrl = require('../github-url');

const { InvalidUrl } = require('../messages/flow');

/**
 * Looks up the GitHub resource that is being referenced in a command.
 */
module.exports = function getResource(types) {
  return (req, res, next) => {
    const { command } = res.locals;
    const url = command.resource;

    // Turn the argument into a resource
    const resource = githubUrl(url);
    console.log(resource);

    const arrTypes = types && !Array.isArray(types) ? [types] : types;

    if (resource && (!arrTypes || arrTypes.includes(resource.type))) {
      res.locals.resource = resource;
      next();
    } else {
      return command.respond(new InvalidUrl(url));
    }
  };
};
