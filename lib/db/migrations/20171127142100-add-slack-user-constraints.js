
module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => queryInterface.addConstraint('SlackUsers',
    ['slackId', 'slackWorkspaceId'],
    {
      type: 'unique',
      name: 'userWorkspaceUniqueConstraint',
    },
  ),
  down: queryInterface => queryInterface.removeConstraint('SlackUsers', 'userWorkspaceUniqueConstraint'),
};
