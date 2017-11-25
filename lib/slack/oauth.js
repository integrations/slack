const slack = require('./client');

module.exports = (robot) => {
  const { SlackWorkspace } = robot.models;
  robot.route('/slack/oauth').get('/callback', async (req, res) => {
    // @todo verify that state is correct
    // @todo send message to installing user asking to link github account
    const { ok, access_token, team_id } = await slack.web.oauth.access(
      process.env.SLACK_CLIENT_ID,
      process.env.SLACK_CLIENT_SECRET,
      req.query.code,
    );
    if (ok) {
      await SlackWorkspace
        .findOrCreate({
          where: { slackId: team_id },
          defaults: { accessToken: access_token },
        })
        .spread((slackWorkspace, created) => {
          robot.log(slackWorkspace.get({ plain: true }));
          robot.log(created);
        });
      res.redirect(
        `https://slack.com/app_redirect?app=${process.env.SLACK_APP_ID}&team=${team_id}`,
      );
    } else {
      res.status(400).send('Slack did not return ok');
    }
  });
};
