const logger = require('../logger');

const syncProcessor = promise => promise;
const asyncProcessor = (promise) => {
  promise.catch(err => logger.error(err, 'Error processing webhook'));
};

module.exports = () => (process.env.NODE_ENV === 'test' ? syncProcessor : asyncProcessor);
