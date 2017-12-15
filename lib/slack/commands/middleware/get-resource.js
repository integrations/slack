const githubUrl = require('../../../github-url.ts');

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
    // @TODO: Move to renderer
    res.json({
      attachments: [{
        color: 'danger',
        text: `\`${url}\` does not appear to be a GitHub link.`,
        mrkdwn_in: ['text'],
      }],
    });
  }
};
