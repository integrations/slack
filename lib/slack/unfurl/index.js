// Roadmap: What do we want to unfurl?
// Phase 1: Issues, Pull Requests, Repositories, Profiles, Organizations, App
// Phase 2: Repository contents (files), Projects, Gists

// likely need different regular expressions based on what we're trying to parse

const githubUrl = require('../../github-url');

/* eslint-disable global-require */
const unfurls = {
  account: require('./account'),
  blob: require('./blob'),
  comment: require('./comment'),
  issue: require('./issue'),
  pull: require('./pull'),
  repo: require('./repo'),
};

// eslint-disable-next-line no-unused-vars
module.exports = async (github, url, unfurlType) => {
  const params = githubUrl(url);

  if (!params || !unfurls[params.type]) {
    throw new Error(`Unmatched unfurl URL: ${url}`);
  }

  return unfurls[params.type](params, github, unfurlType);
};
