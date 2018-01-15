const models = require('../models');

const { createServer, createLogger } = require('probot');
const bodyParser = require('body-parser');

module.exports = {
  models,
  createApp() {
    const app = createServer({ logger: createLogger() });
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use((req, res, next) => {
      res.locals.robot = { models };
      next();
    });

    return app;
  },
};
