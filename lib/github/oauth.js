const queryString = require('query-string');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const GitHubApi = require('github');
const { promisify } = require('util');
const cache = require('../cache');

const github = new GitHubApi();

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

    const { SlackWorkspace, SlackUser, GitHubUser } = robot.models;
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

    slackUser.setGitHubUser(gitHubUser);

    robot.log({ gitHubUser, slackUser }, 'Linked User');

    // @todo: use message builder to render this Message
    await axios.post(slackResponseUrl, {
      response_type: 'ephemeral',
      attachments: [{
        text: `:white_check_mark: Success! <@${slackUserId}> is now connected to <${user.html_url}|@${user.login}>`,
      }],
    });

    // FIXME: move this to another URL
    Object.assign(res.locals, { slackUser, gitHubUser, slackWorkspace: workspace });
    setup(req, res, () => {
      res.redirect(`slack://channel?team=${slackTeamId}&channel=${slackChannelId}`);
    });
  });


  const SubscriptionRequest = require('../slack/commands/subscription-request');
  const { Subscribed } = require('../slack/renderer/flow');

  async function setup(req, res, next) {
    const { slackUser, gitHubUser, slackWorkspace } = res.locals;
    const key = `pending-subscription:${slackUser.slackId}`;

    const command = await cache.get(key);

    if (command) {
      // await cache.delete(key);
      req.log({ command }, 'activating pending subscription');

      const ctx = {
        gitHubUser,
        slackUser,
        slackWorkspace,
      };

      const s = new SubscriptionRequest(command, ctx, robot.models);

      // if (!s.isGitHubAppInstalled()) {
      //   res.redirect(s.installAppUrl());
      //   return;
      // }

      const subscription = await s.subscribe();

      console.log('WTF?', subscription);

      const message = new Subscribed({ subscription, repository: subscription.repository });

      slackWorkspace.client.chat.postMessage(command.channel_id, '', message.toJSON());
    }
    next();
  }
};
