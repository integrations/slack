const slack = require('./client');

const clientId = process.env.SLACK_CLIENT_ID;

module.exports = {
  async login(req, res) {
    // FIXME: make dynamic
    const scope = 'links:read,links:write,commands,chat:write:user,team:read';

    res.redirect(`https://slack.com/oauth/authorize?client_id=${clientId}&scope=${scope}`);
  },

  async callback(req, res) {
    req.log({ req, res, body: req.body });

    const { SlackWorkspace } = res.locals.robot.models;

    req.log.debug({ code: req.query.code }, 'Exchanging code for access token');

    const client = slack.createClient('');

    // The oauth.token method is not available in the SDK yet
    // https://api.slack.com/methods/oauth.token
    // eslint-disable-next-line no-underscore-dangle
    const access = await client._makeAPICall('oauth.token', {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: req.query.code,
    });

    req.log.debug(access, 'Exchanged code for access token');

    if (access.ok) {
      // Check that the team is allowed to use this app
      if (process.env.ALLOWED_TEAMS) {
        const allowedTeams = process.env.ALLOWED_TEAMS.split(',');
        const workspaceClient = slack.createClient(access.access_token);

        // Fetch the team info to get the subdomain
        const info = await workspaceClient.team.info();

        if (!allowedTeams.includes(info.team.domain)) {
          req.log.info(info.team, 'Slack team not allowed');
          // Revoke the token to uninstall the app
          await workspaceClient.auth.revoke();
          return res.redirect('/denied');
        }
      }

      const [workspace, created] = await SlackWorkspace.findOrCreate({
        where: { slackId: access.team_id },
        defaults: { accessToken: access.access_token },
      });

      if (!created) {
        await workspace.update({ accessToken: access.access_token });
      }

      req.log.debug({ created, workspace }, 'Authorized slack workspace');

      res.redirect(`https://slack.com/app_redirect?app=${access.app_id}&team=${access.team_id}`);
    } else {
      res.status(400).send('Slack did not return ok');
    }
  },
};
