const { ValidationError } = require('sequelize');

module.exports = (err, req, res, next) => {
  if (!(err instanceof ValidationError)) {
    return next(err);
  }

  const { command } = res.locals;

  let text = 'Uh oh! ';
  text += err.errors.map(e => e.message).join(', ');

  command.respond({
    response_type: 'ephemeral',
    attachments: [
      {
        text,
        color: 'danger',
        mrkdwn_in: ['text'],
      },
    ],
  });
};
