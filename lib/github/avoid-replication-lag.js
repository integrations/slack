const { promisify } = require('util');

const sleep = promisify(setTimeout);

module.exports = function avoidReplicationLag() {
  let shouldSleep = true;

  return async (options) => {
    // Only GET requests are affected by replication lag
    if (shouldSleep && options.method === 'GET') {
      await sleep(1000);
    }
    shouldSleep = false;
  };
};
