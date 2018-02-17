const Raven = require('raven');

const { Exception } = require('./slack/renderer/flow');

module.exports = {
  setup: (app) => {
    Raven.disableConsoleAlerts();
    Raven.config(process.env.SENTRY_DSN).install();
    app.use(Raven.requestHandler());

    // Route for testing error handling
    app.get('/boom', (req) => {
      const err = new Error('Boom');
      if (req.query.async) {
        return Promise.reject(err);
      }
      throw err;
    });
  },

  teardown: (app) => {
    // The error handler must be before any other error middleware
    app.use(Raven.errorHandler());

    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
      req.log.error(err);

      if (/api\.slack\.com/.test(req.headers['user-agent'])) {
        const message = new Exception(res.sentry).toJSON();
        res.json(message);
      } else {
        res.status(500).send(`An unexpected error occured: ${res.sentry}`);
      }
    });
  },
};
