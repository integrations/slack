const slack = require('./client');

module.exports = (robot) => {
  const { SlackWorkspace } = robot.models;
  robot.route('/slack/oauth').get('/callback', async (req, res) => {
    // @todo verify that state is correct
    // @todo send message to installing user asking to link github account
    const access = await slack.web.oauth.access(
      process.env.SLACK_CLIENT_ID,
      process.env.SLACK_CLIENT_SECRET,
      req.query.code,
    );

    req.log.debug(access, 'Exchanged code for access token');

    if (access.ok) {
      await SlackWorkspace
        .findOrCreate({
          where: { slackId: access.team_id },
          defaults: { accessToken: access.access_token },
        })
        .spread((slackWorkspace, created) => {
          robot.log(slackWorkspace.get({ plain: true }));
          robot.log(created);
        });
      res.redirect(
        `https://slack.com/app_redirect?app=${process.env.SLACK_APP_ID}&team=${access.team_id}`,
      );
    } else {
      res.status(400).send('Slack did not return ok');
    }
  });
};
