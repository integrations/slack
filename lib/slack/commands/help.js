const { Help } = require('../renderer/flow');

module.exports = async (req, res) => {
  res.json(new Help(req.body.command));
};
