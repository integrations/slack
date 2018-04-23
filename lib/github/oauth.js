const queryString = require('query-string');
const axios = require('axios');
const GitHubApi = require('probot/lib/github');

const SignedParams = require('../signed-params');

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
    const command = await PendingCommand.find(state.trigger_id);

    req.log({ state, command }, 'Restoring state to authenticate user');

    if (!command) {
      // FIXME: handle issue with expired command
      throw new Error();
    }

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

    const github = new GitHubApi({ logger: req.log });

    // look up user to get id
    github.authenticate({
      type: 'token',
      token: accessToken,
    });
    const user = (await github.users.get({})).data;

    // store github user id and connect to slack user id
    const [gitHubUser, created] = await GitHubUser.findOrCreate({
      where: { id: user.id },
      defaults: { accessToken },
    });
    if (!created) {
      await gitHubUser.update({ accessToken });
    }

    const workspace = await SlackWorkspace.findOne({ where: { slackId: command.team_id } });

    if (!workspace) {
      throw new Error(`Slack workspace not found: ${command.team_id}`);
    }

    const [slackUser] = await SlackUser.findOrCreate({
      where: { slackId: command.user_id, slackWorkspaceId: workspace.id },
    });

    await slackUser.setGitHubUser(gitHubUser);

    robot.log({ gitHubUser, slackUser }, 'Linked User');

    req.session.slackUserId = slackUser.id;

    // @todo: use message builder to render this Message
    await axios.post(command.response_url, {
      response_type: 'ephemeral',
      attachments: [{
        text: `:white_check_mark: Success! <@${command.user_id}> is now connected to <${user.html_url}|@${user.login}>`,
      }],
    });

    if (command.text.startsWith('signin')) {
      res.redirect(`https://slack.com/app_redirect?team=${command.team_id}&channel=${command.channel_id}`);
    } else {
      res.redirect(`/slack/command?trigger_id=${command.trigger_id}`);
    }
  });
};
