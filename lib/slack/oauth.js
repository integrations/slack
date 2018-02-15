const slack = require('./client');
const crypto = require('crypto');

const clientId = process.env.SLACK_CLIENT_ID;

module.exports = {
  async login(req, res) {
    // FIXME: make dynamic
    const scope = 'links:read,links:write,commands,chat:write,team:read';
    const state = crypto.randomBytes(Math.ceil(30 / 2)).toString('hex').slice(0, 30);

    req.session.slackOAuthState = state;

    res.redirect(`https://slack.com/oauth/authorize?client_id=${clientId}&scope=${scope}&state=${state}`);
  },

  async callback(req, res) {
    req.log({ req, res, body: req.body });

    if (req.query.error && req.query.error === 'access_denied') {
      req.log.debug({ error: req.query.error }, 'User aborted OAuth process');
      return res.status(400).send('User aborted OAuth process. Please try again.');
    }

    if (!req.query.state) {
      req.log.debug('No state param in callback.');
      return res.status(400).send('No state param in callback. Please try again.');
    }

    if (!req.session.slackOAuthState) {
      req.log.debug('No state in session.');
      return res.status(400).send('No state in session. Please try again.');
    }

    const stateFromSlack = Buffer.from(req.query.state);
    const stateFromSession = Buffer.from(req.session.slackOAuthState);

    const matches = stateFromSlack.length === stateFromSession.length &&
      crypto.timingSafeEqual(stateFromSlack, stateFromSession);

    if (!matches) {
      req.log.debug('Session state does not match state.');
      return res.status(400).send('Session state does not match state. Please try again.');
    }

    const { SlackWorkspace } = res.locals.robot.models;

    req.log.debug({ code: req.query.code }, 'Exchanging code for access token');

    const client = slack.createClient('');

    let access;
    try {
      // The oauth.token method is not available in the SDK yet
      // https://api.slack.com/methods/oauth.token
      // eslint-disable-next-line no-underscore-dangle
      access = await client._makeAPICall('oauth.token', {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code: req.query.code,
      });
    } catch (e) {
      req.log.debug(access, 'Failed to exchange code for access token');
      return res.status(400).send('Slack did not return ok. Please try again.');
    }

    req.log.debug(access, 'Exchanged code for access token');
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
  },
};
