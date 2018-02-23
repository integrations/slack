const { Help } = require('../renderer/flow');

module.exports = async (req, res) => {
  const { command } = res.locals;
  res.json(new Help(command.command));
};
