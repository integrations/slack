module.exports = (logger) => {
  if (process.env.NODE_ENV === 'test') return promise => promise;
  return (promise) => {
    promise.catch(err => logger.error(err, 'Error processing webhook'))
  };
};
