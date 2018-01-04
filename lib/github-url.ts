// FIXME: replace this with a legit npm module, preferrably one that already exists
/* eslint-disable no-useless-escape, guard-for-in, no-restricted-syntax */
/* tslint:disable:forin */

// tslint:disable-next-line:no-var-requires (no types for named-regexp)
const { named } =  require("named-regexp");

const base = "(?:https:\/\/github.com\/)?";
const owner = "(:<owner>[^\/]+)";
const repo = "(:<repo>[^\/]+)";
const nwo = `${base}${owner}\/${repo}`;

const line = "L(:<line>\\d+)";

interface IRoutes {
  [key: string]: string;
}
const routes: IRoutes = {
  account: `^${base}${owner}$`,
  blob: `^${nwo}\/blob/(:<ref>[^\/]+)\/(:<path>.+?)(?:#${line}(?:-${line})?)?$`,
  comment: `^${nwo}\/(?:issues|pull)\/(:<number>\\d+)#issuecomment-(:<id>\\d+)`,
  issue: `^${nwo}\/issues\/(:<number>\\d+)$`,
  pull: `^${nwo}\/pull\/(:<number>\\d+)$`,
  repo: `^${nwo}$`,
};

module.exports = (url: string) => {
  for (const type in routes) {
    const match = named(new RegExp(routes[type])).exec(url);
    if (match) {
      interface IResult {
        type: string;
        [key: string]: string;
      }
      const result: IResult = {
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
