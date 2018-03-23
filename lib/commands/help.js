const { Help } = require('../messages/flow');

module.exports = {
  name: 'help',
  // Always matches any command
  matches: () => true,
  action(command) {
    return new Help(command.namespace);
  },
};
