const githubUrl = require('../../../github-url');

const { InvalidUrl } = require('../../renderer/flow');

/**
 * Looks up the GitHub resource that is being referenced in a command.
 */
module.exports = function getResource(req, res, next) {
  const url = req.body.text;

  // Turn the argument into a resource
  const resource = githubUrl(url);

  if (resource && resource.type === 'repo') {
    res.locals.resource = resource;
    next();
  } else {
    res.json(new InvalidUrl(url));
  }
};
