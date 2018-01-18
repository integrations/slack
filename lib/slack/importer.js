// FIXME: refactor and remove before merging
/* eslint-disable no-restricted-syntax, no-await-in-loop */

module.exports = async (req, res) => {
  const { LegacySubscription } = res.locals.robot.models;

  req.log('Importing data', req.body);

  for (const configuration of req.body) {
    await LegacySubscription.import(configuration);
  }

  res.send();
};
