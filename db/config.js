require('dotenv').config();
const os = require('os');

const productionSSLOptions = process.env.DATABASE_CA ? {
  ca: process.env.DATABASE_CA,
} : true;

module.exports = {
  development: {
    database: 'slack-dev',
    host: '127.0.0.1',
    dialect: 'postgres',
    operatorsAliases: false,
    username: process.env.DB_USERNAME_TEST || os.userInfo().username,
  },
  test: {
    database: 'slack-test',
    host: '127.0.0.1',
    dialect: 'postgres',
    operatorsAliases: false,
    username: process.env.DB_USERNAME_TEST || os.userInfo().username,
  },
  production: {
    dialect: 'postgres',
    use_env_variable: 'DATABASE_URL',
    disable_sql_logging: true,
    operatorsAliases: false,
    ssl: true,
    dialectOptions: {
      ssl: productionSSLOptions,
    },
  },
};
