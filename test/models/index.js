const loadModels = require('../../lib/models');
const logger = require('probot/lib/logger');

const models = loadModels({ logger });

// Ensure there is a connection established
beforeAll(async () => models.sequelize.authenticate());
// Close connection when tests are done
afterAll(async () => models.sequelize.close());

// Clear all data out of the test database
beforeEach(() => models.sequelize.truncate({ cascade: true }));

module.exports = models;
