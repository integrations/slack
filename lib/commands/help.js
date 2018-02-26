const { Help } = require('../messages/flow');

module.exports = async (req, res) => {
  const { command } = res.locals;
  await command.respond(new Help(command.command));
};
