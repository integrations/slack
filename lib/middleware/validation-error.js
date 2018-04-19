const { ValidationError } = require('sequelize');

module.exports = (err, req, res, next) => {
  if (!(err instanceof ValidationError)) {
    return next();
  }

  const { command } = res.locals;

  command.respond({
    response_type: 'ephemeral',
    attachments: [
      {
        text: err.toString(),
        color: 'danger',
        mrkdwn_in: ['text'],
      },
    ],
  });
};
