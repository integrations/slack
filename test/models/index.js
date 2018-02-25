const loadModels = require('../../lib/models');
const logger = require('probot/lib/logger');

const models = loadModels({ logger });

beforeAll(async () => {
  // Ensure there is a connection established
  models.sequelize.authenticate();

  // Restore log level after each test
  logger.level(process.env.LOG_LEVEL);
});

// Close connection when tests are done
afterAll(async () => models.sequelize.close());

// Clear all data out of the test database
beforeEach(() => models.sequelize.truncate({ cascade: true }));

module.exports = models;
