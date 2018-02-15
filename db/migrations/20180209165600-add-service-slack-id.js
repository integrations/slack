module.exports = {
  up: async (queryInterface, Sequelize) => {
    const LegacySubscription = queryInterface.sequelize.define('LegacySubscription', {
      workspaceSlackId: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      repoGitHubId: {
        allowNull: false,
        type: Sequelize.BIGINT,
      },
      repoFullName: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      authorSlackId: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      channelSlackId: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      serviceSlackId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      originalSlackConfiguration: {
        allowNull: false,
        type: Sequelize.JSON,
      },
      activatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
    await queryInterface.addColumn('LegacySubscriptions', 'activatedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('LegacySubscriptions', 'serviceSlackId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    const allLegacySubscriptions = await LegacySubscription.findAll();
    await Promise.all(allLegacySubscriptions.map((legacySubscription) => {
      // eslint-disable-next-line no-param-reassign
      legacySubscription.serviceSlackId = legacySubscription.originalSlackConfiguration.id;
      return legacySubscription.save();
    }));
    await queryInterface.changeColumn('LegacySubscriptions', 'serviceSlackId', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('LegacySubscriptions', 'serviceSlackId');
    await queryInterface.removeColumn('LegacySubscriptions', 'activatedAt');
  },
};
