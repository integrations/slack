const githubUrl = require('./github-url');

/**
 * Resolve references into GitHub resources.
 *
 * @example

 *   const Resolver = require('./resolver')
 *   const resolver = new Resolver(context.github)
 *   const repo = resolver.resource('https://github.com/probot/probot')
 *   // {full_name: "probot/probot", id: 987, …}
 */
class Resolver {
  /**
   * @param {github} github - a GitHub API client that is used resolve resources
   */
  constructor(github) {
    this.github = github;
  }

  /**
   * Resolve a GitHub URL into a resorce for that URL
   *
   * @params {string} url - A URL to a GitHub resource,
   *                        e.g. https://github.com/github-slack/app
   */
  resource(url) {
    const params = githubUrl(url);

    if (params && this[params.type]) {
      return this[params.type](params);
    }
  }

  repo({ owner, repo }) {
    return this.github.repos.get({ owner, repo }).then(res => res.data);
  }
}

module.exports = Resolver;
