const Raven = require('raven');
const timeout = require('connect-timeout');
const uuidv4 = require('uuid/v4');

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
        req.log.warn('Request took more than 10 seconds');
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
    app.use((err, req, res, _next) => {
      const customUUID = uuidv4();
      const isInSentry = res.sentry !== undefined;

      if (!res.sentry) {
        // create a reference uuid if sentry did not catch the error
        res.sentry = customUUID;
      }
      const { command } = res.locals;

      const reportData = {
        reqBody: req.body,
        reqUrl: req.url,
        resBody: res.body,
        sentryId: res.sentry,
        ref: res.sentry,
        uuid: customUUID,
        error: err,
        isInSentry,
        command,
      };

      req.log.error(reportData, 'Fatal error occured.');

      const message = new Exception(res.sentry, command).toJSON();

      if (command) {
        return command.respond(message);
      } else if (res.headersSent) {
        req.log.warn({ err, ref: res.sentry }, 'Headers were already sent. Not responding to user.');
      } else if (isRequestFromSlack(req)) {
        res.json(message);
      } else {
        res.status(500).send(`An unexpected error occured. ref: ${res.sentry}`);
      }
    });
  },
};
