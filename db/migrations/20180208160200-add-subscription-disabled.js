module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subscriptions', 'disabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('Subscriptions', 'disableReason', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.removeConstraint('Subscriptions', 'Subscriptions_installationId_fkey');
    await queryInterface.addConstraint('Subscriptions', ['installationId'], {
      type: 'FOREIGN KEY',
      name: 'Subscriptions_installationId_fkey',
      references: {
        table: 'Installations',
        field: 'id',
      },
      onDelete: 'no action',
      onUpdate: 'no action',
    });
    await queryInterface.changeColumn('Subscriptions', 'installationId', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Subscriptions', 'installationId', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });
    await queryInterface.removeConstraint('Subscriptions', 'Subscriptions_installationId_fkey');
    await queryInterface.addConstraint('Subscriptions', ['installationId'], {
      type: 'FOREIGN KEY',
      name: 'Subscriptions_installationId_fkey',
      references: {
        table: 'Installations',
        field: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'no action',
    });
    await queryInterface.removeColumn('Subscriptions', 'disabled');
    await queryInterface.removeColumn('Subscriptions', 'disableReason');
  },
};
