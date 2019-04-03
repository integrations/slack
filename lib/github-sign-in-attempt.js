const cache = require('./cache');

const ONE_HOUR = 60 * 60 * 1000;

function cacheKey(teamId, userId) {
  return `github-sign-in-initiated#${teamId}:${userId}`;
}

async function initiate(teamId, userId) {
  await cache.set(cacheKey(teamId, userId), true, ONE_HOUR);
}

async function confirm(teamId, userId) {
  return !!await cache.get(cacheKey(teamId, userId));
}

async function clear(teamId, userId) {
  await cache.delete(cacheKey(teamId, userId));
}

module.exports = {
  initiate,
  confirm,
  clear,
};
