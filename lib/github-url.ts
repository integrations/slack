// FIXME: replace this with a legit npm module, preferrably one that already exists
/* eslint-disable no-useless-escape, guard-for-in, no-restricted-syntax */

const { named } = require('named-regexp');

const base = '(?:https:\/\/github.com\/)?';
const owner = '(:<owner>[^\/]+)';
const repo = '(:<repo>[^\/]+)';
const nwo = `${base}${owner}\/${repo}`;

const line = 'L(:<line>\\d+)';

interface routes {
  [key: string]: string;
}
const routes: routes = {
  blob: `^${nwo}\/blob/(:<ref>[^\/]+)\/(:<path>.+?)(?:#${line}(?:-${line})?)?$`, // (?:#L(:<start>\\d+)(?-(:<end>\\d+))?)?
  comment: `^${nwo}\/(?:issues|pull)\/(:<number>\\d+)#issuecomment-(:<id>\\d+)`,
  issue: `^${nwo}\/issues\/(:<number>\\d+)$`,
  pull: `^${nwo}\/pull\/(:<number>\\d+)$`,
  repo: `^${nwo}$`,
  account: `^${base}${owner}$`,
};

module.exports = (url: string) => {
  for (const type in routes) {
    const match = named(new RegExp(routes[type])).exec(url);
    if (match) {
      interface result {
        type: string,
        [key: string]: string,
      }
      const result: result = {
        type,
      };
      Object.keys(match.captures).forEach((name) => {
        const values = match.captures[name].filter((value: string | undefined) => value !== undefined);
        if (values.length > 1) {
          result[name] = values;
        } else if (match.captures[name][0] !== undefined) {
          result[name] = values[0];
        }
      });
      return result;
    }
  }
};
