const githubUrl = require('./github-url');

/**
 * Resolve references (e.g. `owner/repo#124`) into resource parameters
 */
class Resolver {
  constructor(github) {
    this.github = github
  }

  resource(arg) {
    const params = githubUrl(arg)

    return this[params.type](params)
  }

  repo({owner, repo, type}) {
    return this.github.repos.get({owner, repo}).then(res => res.data)
  }
}

module.exports = Resolver
