// util.promsify won't work here:
// https://github.com/integrations/slack/pull/494#issuecomment-376735607
const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

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
