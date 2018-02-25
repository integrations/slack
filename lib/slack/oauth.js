const slack = require('./client');
const crypto = require('crypto');

const { SlackInstalled } = require('./renderer/flow');

const clientId = process.env.SLACK_CLIENT_ID;

module.exports = {
  async login(req, res) {
    // FIXME: make dynamic
    const scope = 'links:read,links:write,commands,chat:write,team:read';
    const slackRootUrl = process.env.SLACK_ROOT_URL || 'https://slack.com';
    const state = crypto.randomBytes(Math.ceil(30 / 2)).toString('hex').slice(0, 30);

    req.session.slackOAuthState = state;

    res.redirect(`${slackRootUrl}/oauth/authorize?client_id=${clientId}&scope=${scope}&state=${state}`);
  },

  async callback(req, res) {
    req.log({ req, res, body: req.body });

    if (req.query.error && req.query.error === 'access_denied') {
      req.log.debug({ error: req.query.error }, 'User aborted OAuth process');
      return res.redirect('/slack/oauth/login');
    }

    if (!req.query.state) {
      req.log.debug('No state param in callback.');
      return res.redirect('/slack/oauth/login');
    }

    if (!req.session.slackOAuthState) {
      req.log.debug('No state in session.');
      return res.redirect('/slack/oauth/login');
    }

    const stateFromSlack = Buffer.from(req.query.state);
    const stateFromSession = Buffer.from(req.session.slackOAuthState);

    const matches = stateFromSlack.length === stateFromSession.length &&
      crypto.timingSafeEqual(stateFromSlack, stateFromSession);

    if (!matches) {
      req.log.debug('Session state does not match state.');
      return res.redirect('/slack/oauth/login');
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
      return res.redirect('/slack/oauth/login');
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

    const slackRootUrl = process.env.SLACK_ROOT_URL || 'https://slack.com';

    // Post onboarding message to installting user
    await workspace.client.chat.postMessage(access.authorizing_user_id, '', new SlackInstalled().toJSON());

    return res.redirect(`${slackRootUrl}/app_redirect?app=${access.app_id}&team=${access.team_id}`);
  },
};
