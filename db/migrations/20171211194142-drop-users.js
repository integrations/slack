module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('SlackUsers', 'githubId', {
      type: Sequelize.BIGINT,
    });

    await queryInterface.sequelize.query(`
      UPDATE "SlackUsers"
      SET "githubId" = "GitHubUsers"."githubId"
      FROM "GitHubUsers"
      WHERE "GitHubUsers"."userId" = "SlackUsers"."userId"
    `);

    await queryInterface.removeColumn('SlackUsers', 'userId');
    await queryInterface.removeColumn('GitHubUsers', 'userId');
    await queryInterface.dropTable('Users');

    await queryInterface.removeColumn('GitHubUsers', 'id');
    await queryInterface.renameColumn('GitHubUsers', 'githubId', 'id');
    await queryInterface.addConstraint('GitHubUsers', ['id'], {
      type: 'primary key',
      name: 'GitHubUsers_id_pk',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('GitHubUsers', 'GitHubUsers_id_pk');
    await queryInterface.renameColumn('GitHubUsers', 'id', 'githubId');
    await queryInterface.addColumn('GitHubUsers', 'id', {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT,
    });

    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addColumn('SlackUsers', 'userId', {
      type: Sequelize.BIGINT,
    });

    await queryInterface.addColumn('GitHubUsers', 'userId', {
      type: Sequelize.BIGINT,
      unique: true,
    });

    await queryInterface.removeColumn('SlackUsers', 'githubId');
  },
};
