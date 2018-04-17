const Raven = require('raven');
const timeout = require('connect-timeout');

const { Exception } = require('./messages/flow');
const isRequestFromSlack = require('./is-request-from-slack');

module.exports = {
  setup: (app) => {
    Raven.disableConsoleAlerts();
    Raven.config(process.env.SENTRY_DSN, {
      release: process.env.HEROKU_SLUG_COMMIT,
    }).install();

    app.use(Raven.requestHandler());
    app.use(timeout('10s'));
    app.use((req, res, next) => {
      req.on('timeout', () => {
        req.log.warn('Request timeout');
      });

      next();
    });

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

      const { command } = res.locals;
      const message = new Exception(res.sentry, command).toJSON();

      if (command) {
        return command.respond(message);
      } else if (res.headersSent) {
        req.log.warn({ err }, 'Headers were already sent, so swallowing error');
      } else if (isRequestFromSlack(req)) {
        res.json(message);
      } else {
        res.status(500).send(`An unexpected error occured: ${res.sentry}`);
      }
    });
  },
};
