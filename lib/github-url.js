// FIXME: replace this with a legit npm module, preferrably one that already exists
/* eslint-disable no-useless-escape, guard-for-in, no-restricted-syntax */

const { named } = require('named-regexp');

const base = '^https:\/\/github.com';
const owner = '(:<owner>[^\/]+)';
const repo = '(:<repo>[^\/]+)';
const nwo = `${base}\/${owner}\/${repo}`;

const routes = {
  comment: `${nwo}\/(?:issues|pull)\/(:<number>\\d+)#issuecomment-(:<id>\\d+)`,
  issue: `${nwo}\/issues\/(:<number>\\d+)$`,
  pull: `${nwo}\/pull\/(:<number>\\d+)$`,
  profile: `${base}\/${owner}$`,
};

module.exports = (url) => {
  for (const type in routes) {
    const match = named(new RegExp(routes[type])).exec(url);
    if (match) {
      const result = {};
      result.type = type;
      Object.keys(match.captures).forEach((name) => {
        result[name] = match.capture(name);
      });
      return result;
    }
  }
};
