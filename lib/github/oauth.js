const queryString = require('query-string');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const GitHubApi = require('github');
const { promisify } = require('util');

const github = new GitHubApi();

module.exports = (robot) => {
  // @todo: @wilhelmklopp to open security review issue about this
  robot.route().get('/github/oauth/login', (req, res) => {
    // should persist state in persistent session store
    const state = req.query.state;
    const params = {
      state,
      client_id: process.env.GITHUB_CLIENT_ID,
    };
    res.redirect(
      `https://github.com/login/oauth/authorize?${queryString.stringify(params)}`,
    );
  });

  robot.route().get('/github/oauth/callback', async (req, res) => {
    // verify state here, if it doesn't match, 400: Bad Request

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

    // sign with default (HMAC SHA256)
    const state = await promisify(jwt.verify)(req.query.state, process.env.GITHUB_CLIENT_SECRET);
    const slackTeamId = state.teamId;
    const slackUserId = state.userId;
    const slackChannelId = state.channelId;
    const slackResponseUrl = state.responseUrl;

    const { User, SlackUser, GitHubUser } = robot.models;
    // store github user id and connect to slack user id
    let userId;
    const slackUser = await SlackUser
      .findOne({
        where: { slackId: slackUserId },
      });
    if (!slackUser) {
      userId = (await User.create()).id;

      await SlackUser.create({
        slackId: slackUserId,
        userId,
      });
    } else {
      userId = slackUser.SlackUsers[0].userId;
    }

    await GitHubUser.findOrCreate({
      where: { githubId: githubUserId },
      defaults: { userId, accessToken },
    })
    .then(([gitHubUser, created]) => {
      robot.log({ created, gitHubUser }, 'Created and linked GitHubUser');
      if (!created) {
        gitHubUser.update(accessToken);
      }
    });

    // @todo: use message builder to render this Message
    await axios.post(slackResponseUrl, {
      response_type: 'ephemeral',
      attachments: [{
        text: `:white_check_mark: Success! <@${slackUserId}> is now connected to <${user.html_url}|@${user.login}>`,
      }],
    });
    res.redirect(`slack://channel?team=${slackTeamId}&channel=${slackChannelId}`);
  });
};
