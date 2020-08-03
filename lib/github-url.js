/* eslint-disable no-useless-escape, guard-for-in, no-restricted-syntax */

const url = require('url');
const { named } = require('named-regexp');

const owner = '(:<owner>[^\/]+)';
const repo = '(:<repo>[^\/]+)';
const line = 'L(:<line>\\d+)';

const baseRoutes = () => {
  const host = process.env.GHE_HOST || 'github.com';
  const protocol = process.env.GHE_PROTOCOL || 'https';

  return {
    host,
    protocol,
    baseUrl: `${protocol}:\/\/${host}`,
    apiUrl: `${protocol}://${host}/api/v3`,
  };
};

const routePatterns = () => {
  const { baseUrl } = baseRoutes();
  const base = `(?:${baseUrl}\/)?`;
  const nwo = `${base}${owner}\/${repo}`;

  return {
    account: `^${base}${owner}$`,
    blob: `^${nwo}\/blob/(:<ref>[^\/]+)\/(:<path>.+?)(?:#${line}(?:-${line})?)?$`,
    comment: `^${nwo}\/(?:issues|pull)\/(:<number>\\d+)#issuecomment-(:<id>\\d+)`,
    issue: `^${nwo}(?:\/issues\/|#)(:<number>\\d+)$`,
    pull: `^${nwo}\/pull\/(:<number>\\d+)$`,
    repo: `^${nwo}$`,
  };
};

module.exports = (uri) => {
  const routes = routePatterns();

  for (const type in routes) {
    const match = named(new RegExp(routes[type])).exec(uri);
    if (match) {
      const result = {
        type,
      };
      Object.keys(match.captures).forEach((name) => {
        const values = match.captures[name].filter(value => value !== undefined);
        if (values.length > 1) {
          result[name] = values;
        } else if (match.captures[name][0] !== undefined) {
          // eslint-disable-next-line prefer-destructuring
          result[name] = values[0];
        }
      });
      return result;
    }
  }
};

module.exports.baseRoutes = baseRoutes;
module.exports.resolve = (path) => url.resolve(baseRoutes().baseUrl, path);
