const queryString = require('query-string');
const axios = require('axios');
const crypto = require('crypto');
const base64url = require('base64-url');
const GitHubApi = require('github');

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

    const decipher = crypto.createDecipher('aes-256-cbc', process.env.CRYPTO_SECRET);
    const unescapedState = base64url.unescape(req.query.state);
    let decryptedState = decipher.update(unescapedState, 'base64', 'utf8');
    decryptedState += decipher.final('utf8');

    const state = JSON.parse(decryptedState);
    const slackTeamId = state.teamId;
    const slackUserId = state.userId;
    const slackChannelId = state.channelId;
    const slackResponseUrl = state.responseUrl;

    const { User, SlackUser, SlackWorkspace, GitHubUser } = robot.models;
    // store github user id and connect to slack user id
    let userId;
    const slackWorkspaceUser = await SlackWorkspace
      .findOne({
        where: { slackId: slackTeamId },
        include: [{
          model: SlackUser,
          where: {
            slackId: slackUserId,
          },
        }],
      });
    if (!slackWorkspaceUser) {
      userId = (await User.create()).id;
      const slackWorkspace = await SlackWorkspace.findOne(
        { where: { slackId: slackTeamId } },
      );

      await SlackUser.create({
        slackId: slackUserId,
        userId,
        slackWorkspaceId: slackWorkspace.id,
      });
    } else {
      userId = slackWorkspaceUser.SlackUsers[0].userId;
    }

    await GitHubUser.findOrCreate({
      where: { githubId: githubUserId },
      defaults: { userId, accessToken },
    })
    .spread((gitHubUser, created) => {
      robot.log(gitHubUser.get({ plain: true }));
      robot.log(created);
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
