const queryString = require('query-string');
const axios = require('axios');
const crypto = require('crypto');
const { GitHubAPI, ProbotOctokit } = require('../github/client');

const SignedParams = require('../signed-params');
const SignInConfirm = require('../messages/flow/sign-in-confirm');
const { deliverAfterSignIn } = require('../unfurls');
const signout = require('../activity/signout');

const {
  SlackWorkspace, SlackUser, GitHubUser, PendingCommand,
} = require('../models');

module.exports = (robot) => {
  robot.route().get('/github/oauth/callback', async (req, res) => {
    if (!req.query.state) {
      return res.status(400).send('Error: State parameter was not provided');
    }

    let state;
    try {
      state = await SignedParams.load(req.query.state);
    } catch (err) {
      if (err.name && err.name === 'JsonWebTokenError') {
        return res.status(400).send(`Error: ${err.message}`);
      } else if (err.name && err.name === 'TokenExpiredError') {
        return res.status(400).send(`Error: ${err.message}`);
      }
      throw err;
    }

    if (!req.session.githubOAuthState) {
      req.log('No Gitub OAuth state cookie set');
      return res.status(400).send('Error: No OAuth state cookie set');
    }

    const stateFromGithub = Buffer.from(state.githubOAuthState);
    const stateFromSession = Buffer.from(req.session.githubOAuthState);

    const matches = stateFromGithub.length === stateFromSession.length &&
      crypto.timingSafeEqual(stateFromGithub, stateFromSession);

    if (!matches) {
      req.log('GitHub session state does not match state.');
      return res.status(400).send('Error: OAuth State mismatch, please try again.');
    }

    const { teamSlackId, userSlackId, channelSlackId } = state;

    req.log({ state }, 'Restoring state to authenticate user');

    // complete OAuth dance
    const accessTokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: req.query.code,
        state: req.query.state,
      },
    );
    req.log.debug(accessTokenResponse.data, 'Exchanged code for access token');
    const accessToken = queryString.parse(accessTokenResponse.data).access_token;

    const github = GitHubAPI({
      Octokit: ProbotOctokit,
      logger: req.log,
      retry: {
        // disable retries to test error states
        enabled: false,
      },
      throttle: {
        // disabled to test upgrade behavior without Bottleneck
        enabled: false,
      },
    });

    // look up user to get id
    github.authenticate({
      type: 'token',
      token: accessToken,
    });
    const user = (await github.users.getAuthenticated({})).data;
    const defaults = { accessToken, login: user.login };

    // store github user id and connect to slack user id
    const [gitHubUser, created] = await GitHubUser.findOrCreate({
      where: { id: user.id },
      defaults,
    });
    if (!created) {
      await gitHubUser.update(defaults);
    }

    const workspace = await SlackWorkspace.findOne({ where: { slackId: teamSlackId } });

    if (!workspace) {
      throw new Error(`Slack workspace not found: ${teamSlackId}`);
    }

    const [slackUser] = await SlackUser.findOrCreate({
      where: { slackId: userSlackId, slackWorkspaceId: workspace.id },
    });

    await slackUser.setGitHubUser(gitHubUser);

    robot.log({ gitHubUser, slackUser }, 'Linked User');

    await workspace.client.chat.postEphemeral({
      channel: channelSlackId,
      user: userSlackId,
      attachments: [new SignInConfirm(userSlackId, user.html_url, user.login).getAttachment()],
    });

    const redirectUrl = `https://slack.com/app_redirect?team=${teamSlackId}&channel=${channelSlackId}`;

    if (state.replaySlashCommand) {
      const command = await PendingCommand.find(state.trigger_id);

      if (!command) {
        // In case it has been more than 30min since the user
        // executed the initial command, we won't have it in the cache anymore
        // so we just send them back to Slack without replaying the command
        return res.redirect(redirectUrl);
      }

      return res.redirect(`/slack/command?trigger_id=${command.trigger_id}`);
    }

    if (state.actionCallbackId && /unfurl-\d+/.test(state.actionCallbackId)) {
      // attempt to fulfil request to unfurl link now that the user is connected
      await deliverAfterSignIn(state.actionCallbackId.replace('unfurl-', ''));
    }

    return res.redirect(redirectUrl);
  });

  robot.on('github_app_authorization.revoked', async (context) => {
    const slackUsers = await SlackUser.findAll({
      where: { githubId: context.payload.sender.id },
      include: [SlackWorkspace],
    });
    robot.log.debug({ gitHubUser: context.payload.sender, slackUsers }, 'User revoked GitHub App authorization');

    await Promise.all(slackUsers.map(slackUser => signout(
      robot,
      slackUser,
      slackUser.SlackWorkspace,
    )));
  });
};
