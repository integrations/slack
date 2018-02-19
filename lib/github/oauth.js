const queryString = require('query-string');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const GitHubApi = require('probot/lib/github');
const { promisify } = require('util');

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
    const githubUserId = user.id;

    // @todo: handle condition where state is expired or has been tampered with
    const state = await promisify(jwt.verify)(req.query.state, process.env.GITHUB_CLIENT_SECRET);
    const slackTeamId = state.teamId;
    const slackUserId = state.userId;
    const slackChannelId = state.channelId;
    const slackResponseUrl = state.responseUrl;

    const {
      SlackWorkspace, SlackUser, GitHubUser, PendingCommand,
    } = robot.models;
    // store github user id and connect to slack user id

    const [gitHubUser, created] = await GitHubUser.findOrCreate({
      where: { id: githubUserId },
      defaults: { accessToken },
    });
    if (!created) {
      await gitHubUser.update({ accessToken });
    }

    const workspace = await SlackWorkspace.findOne({ where: { slackId: slackTeamId } });

    if (!workspace) {
      throw new Error(`Slack workspace not found: ${slackTeamId}`);
    }

    const [slackUser] = await SlackUser.findOrCreate({
      where: { slackId: slackUserId, slackWorkspaceId: workspace.id },
    });

    await slackUser.setGitHubUser(gitHubUser);

    robot.log({ gitHubUser, slackUser }, 'Linked User');

    req.session.slackUserId = slackUser.id;

    // @todo: use message builder to render this Message
    await axios.post(slackResponseUrl, {
      response_type: 'ephemeral',
      attachments: [{
        text: `:white_check_mark: Success! <@${slackUserId}> is now connected to <${user.html_url}|@${user.login}>`,
      }],
    });

    if (await PendingCommand.find(slackUserId)) {
      res.redirect('/slack/command');
    } else {
      res.redirect(`slack://channel?team=${slackTeamId}&channel=${slackChannelId}`);
    }
  });
};
