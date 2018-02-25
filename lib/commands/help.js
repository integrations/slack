const { Help } = require('../messages/flow');

module.exports = async (req, res) => {
  const { command } = res.locals;
  res.json(new Help(command.command));
};
