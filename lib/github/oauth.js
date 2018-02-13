const queryString = require('query-string');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const GitHubApi = require('github');
const { promisify } = require('util');
const cache = require('../cache');

const github = new GitHubApi();
const githubUrl = require('../github-url');

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

  async function setup(req, res, next) {
    const { slackUser, gitHubUser, slackWorkspace } = res.locals;
    const { Installation, Subscription } = robot.models;

    // FIXME: move to separate URL
    const command = await cache.get(`pending-subscription:${slackUser.slackId}`);

    req.log({ command }, 'activating pending subscription');

    // SWEET JESUS, close your eyes and look away
    if (command) {
      // Turn the argument into a resource
      const resource = githubUrl(command.args[0]);
      const [owner, installation] = await Installation.getByUsername(resource.owner);

      if (!installation) {
        const info = await robot.info();
        res.redirect(`${info.html_url}/installations/new/permissions?target_id=${owner.id}`);
        return;
      }

      const repository = (await gitHubUser.client.repos.get({
        owner: resource.owner, repo: resource.repo,
      })).data;

      let subscription = await Subscription.lookupOne(
        repository.id,
        command.channel.id,
        slackWorkspace.id,
        installation.id,
      );

      if (!subscription) {
        subscription = await Subscription.subscribe({
          channelId: command.channel_id,
          creatorId: slackUser.id,
          githubId: repository.id,
          installationId: installation.id,
          slackWorkspaceId: slackWorkspace.id,
        });
      }

      const settings = command.args[1];
      if (settings) {
        req.log.debug({ settings }, 'Subscription already exists, updating settings');
        subscription.enable(settings);
        await subscription.save();
      }

      return;
    }
    next();
  }
};
