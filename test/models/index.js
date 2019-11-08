const models = require('../../lib/models');
const logger = require('../../lib/logger');

beforeAll(async () => {
  if (global.gc) {
    global.gc();
  }
  // Ensure there is a connection established
  models.sequelize.authenticate();

  // Restore log level after each test
  logger.level(process.env.LOG_LEVEL);
});

// Close connection when tests are done
afterAll(async () => models.sequelize.close());

// Clear all data out of the test database
beforeEach(() => models.sequelize.truncate({ cascade: true, restartIdentity: true }));

module.exports = models;
