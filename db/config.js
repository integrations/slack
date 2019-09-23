require('dotenv').config();
const os = require('os');

module.exports = {
  development: {
    database: 'slack-dev',
    host: '127.0.0.1',
    dialect: 'postgres',
    operatorsAliases: false,
  },
  test: {
    database: 'slack-test',
    host: '127.0.0.1',
    dialect: 'postgres',
    operatorsAliases: false,
    username: process.env.DB_USERNAME_TEST || os.userInfo().username,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    disable_sql_logging: true,
    operatorsAliases: false,
    ssl: true,
    dialectOptions: {
      ssl: true,
    },
  },
};
