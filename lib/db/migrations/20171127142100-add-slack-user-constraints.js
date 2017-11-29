
module.exports = {
  up: queryInterface => queryInterface.addConstraint('SlackUsers',
    ['slackId', 'slackWorkspaceId'],
    {
      type: 'unique',
      name: 'userWorkspaceUniqueConstraint',
    },
  ),
  down: queryInterface => queryInterface.removeConstraint('SlackUsers', 'userWorkspaceUniqueConstraint'),
};
