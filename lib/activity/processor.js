/**
 * We don't want to wait to send a response on a webhook request to avoid timeouts and also
 * to close connections with github.com as soon as possible and thus reduce the memory usage.
 *
 * However for tests we want an easy way to test that the all the work required for the webhook
 * has been done and thus we can run the assertions of the test.
 *
 * So if NODE_ENV === 'test' we just return the promise and in any other case we
 * do not await for the reponse. We have just to handle the error case.
 * Since there's no await or return with the original promise, the promise is executed
 * indepentently of the webhook flow.
 */
module.exports = (logger) => {
  if (process.env.NODE_ENV === 'test') return promise => promise;
  return (promise) => {
    promise.catch(err => logger.error(err, 'Error processing webhook'));
  };
};
