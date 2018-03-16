const EncryptedField = require('sequelize-encrypted');

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  require('dotenv').config();
}

if (!process.env.STORAGE_SECRET) {
  throw new Error('The STORAGE_SECRET environment variable must be set');
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('GitHubUsers', 'secrets', Sequelize.BLOB);
    await queryInterface.addColumn('SlackWorkspaces', 'secrets', Sequelize.BLOB);

    // Define models to migrate old data
    const workspaceEncrypted = EncryptedField(Sequelize, process.env.STORAGE_SECRET);
    const SlackWorkspace = queryInterface.sequelize.define('SlackWorkspace', {
      rawAccessToken: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'accessToken',
      },

      secrets: workspaceEncrypted.vault('secrets'),

      encryptedAccessToken: workspaceEncrypted.field('accessToken', {
        type: Sequelize.STRING,
        allowNull: false,
      }),
    });

    const userEncrypted = EncryptedField(Sequelize, process.env.STORAGE_SECRET);
    const GitHubUser = queryInterface.sequelize.define('GitHubUsers', {
      // Old access token
      rawAccessToken: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'accessToken',
      },

      secrets: userEncrypted.vault('secrets'),

      encryptedAccessToken: userEncrypted.field('accessToken', {
        type: Sequelize.STRING,
        allowNull: false,
      }),
    });

    // How many records to attempt to update in each batch
    const perPage = 20;

    const models = [GitHubUser, SlackWorkspace];
    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for (const model of models) {
      let page = 0;
      let records = [];

      do {
        records = await model.findAll({
          where: {},
          order: [['createdAt', 'ASC'], ['id', 'DESC']],
          limit: perPage,
          offset: page * perPage,
        });

        await Promise.all(records.map(record => (
          record.update({ encryptedAccessToken: record.rawAccessToken })
        )));

        page += 1;
      } while (records.length > 0);
    }

    await queryInterface.removeColumn('GitHubUsers', 'accessToken');
    await queryInterface.removeColumn('SlackWorkspaces', 'accessToken');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('GitHubUsers', 'accessToken', Sequelize.STRING);
    await queryInterface.addColumn('SlackWorkspaces', 'accessToken', Sequelize.STRING);
    await queryInterface.removeColumn('GitHubUsers', 'secrets');
    await queryInterface.removeColumn('SlackWorkspaces', 'secrets');
  },
};
