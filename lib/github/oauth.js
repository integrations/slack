const queryString = require('query-string');
const axios = require('axios');
const GitHubAPI = require('../github/client');

const SignedParams = require('../signed-params');
const SignInConfirm = require('../messages/flow/sign-in-confirm');
const { deliverAfterSignIn } = require('../unfurls');
const signout = require('../activity/signout');

const {
  SlackWorkspace, SlackUser, GitHubUser, PendingCommand,
} = require('../models');

module.exports = (robot) => {
  robot.route().get('/github/oauth/login', (req, res) => {
    // should persist state in persistent session store
    const { state } = req.query;
    const params = {
      state,
      client_id: process.env.GITHUB_CLIENT_ID,
    };
    res.redirect(`https://github.com/login/oauth/authorize?${queryString.stringify(params)}`);
  });

  robot.route().get('/github/oauth/callback', async (req, res) => {
    // @todo: handle condition where state is expired or has been tampered with
    const state = await SignedParams.load(req.query.state);

    let command;
    let teamSlackId;
    let channelSlackId;
    let userSlackId;
    if (state.trigger_id) {
      command = await PendingCommand.find(state.trigger_id);

      if (!command) {
        // FIXME: handle issue with expired command
        throw new Error();
      }
      teamSlackId = command.team_id;
      channelSlackId = command.channel_id;
      userSlackId = command.user_id;
    } else if (state.slackEvent) {
      teamSlackId = state.slackEvent.team_id;
      userSlackId = state.slackEvent.event.user;
      channelSlackId = state.slackEvent.event.channel;
    } else if (state.slackAction) {
      teamSlackId = state.slackAction.team.id;
      userSlackId = state.slackAction.user.id;
      channelSlackId = state.slackAction.channel.id;
    }

    req.log({ state, command }, 'Restoring state to authenticate user');

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

    const github = GitHubAPI({ logger: req.log });

    // look up user to get id
    github.authenticate({
      type: 'token',
      token: accessToken,
    });
    const user = (await github.users.get({})).data;
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

    req.session.slackUserId = slackUser.id;

    const redirectUrl = `https://slack.com/app_redirect?team=${teamSlackId}&channel=${channelSlackId}`;
    if (command) {
      await axios.post(command.response_url, {
        response_type: 'ephemeral',
        attachments: [new SignInConfirm(userSlackId, user.html_url, user.login).getAttachment()],
      });

      if (command.text.startsWith('signin')) {
        return res.redirect(redirectUrl);
      } else if (command.text.startsWith('signout')) {
        return res.redirect(redirectUrl);
      }
      return res.redirect(`/slack/command?trigger_id=${command.trigger_id}`);
    }
    await workspace.client.chat.postEphemeral({
      channel: channelSlackId,
      user: userSlackId,
      attachments: [new SignInConfirm(userSlackId, user.html_url, user.login).getAttachment()],
    });
    if (state.slackAction && /unfurl-\d+/.test(state.slackAction.callback_id)) {
      // attempt to fulfil request to unfurl link now that the user is connected
      await deliverAfterSignIn(state.slackAction.callback_id.replace('unfurl-', ''));
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
