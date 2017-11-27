const queryString = require('query-string');
const axios = require('axios');
const crypto = require('crypto');
const base64url = require('base64-url');

module.exports = (robot) => {
  // probably can't use the github-oauth library

  // @todo: @wilhelmklopp to open security review issue about this
  // generate base64 encoded (and symetrically encrypted) state string
  // example:
  // {
  //   randomState: "b5e1b53a24989222435db99db24843ef5b43", // random
  //   teamId: "T0234234",
  //   channelId: "C0asd335", // want to redirect to this at the end of the flow
  //   userId: "W0sdasddv",
  //   subscriptionRequest: "owner/repo" // optional. passed in if this auth flow was kicked off by a /github subscribe slash command
  // }
  // send slack message with link to own site (/github/oauth/login); that sets cookie with state
  // forward to github authorise page
  // we receive callback, decrypt
  // verify that cookie randomState matches decrypted state object
  // do calls to GitHub API to get user access token, and user id
  // check if slack user already exists, if so get it
  // check if github user already exists, if so get it
  // link the two with the User model
  // save access token on through model between installation and user
  // (where does the installation id come from?)
  // (res.send()) redirect to slack:// to channel (close window if possible)
  // send ephemeral message to Slack saying that your account is now linked on this workspace
  // if subscriptionRequest, kick off that flow

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
    const accessToken = queryString.parse(accessTokenResponse.data).access_token;

    // look up user to get id
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });
    const githubUserId = userResponse.data.id;

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
    // store github user id and link to slack user id
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
      userId = (await User.create()).dataValues.id;
      const slackWorkspace = await SlackWorkspace.findOne(
        { where: { slackId: slackTeamId } },
      );
      SlackUser.create({
        slackId: slackUserId,
        userId,
        slackWorkspaceId: slackWorkspace.dataValues.id,
      });
    } else {
      userId = slackWorkspaceUser.dataValues.SlackUsers[0].dataValues.userId;
    }

    GitHubUser.findOrCreate({
      where: { githubId: githubUserId },
      // @todo: set access token on this model
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
        text: `:white_check_mark: Success! <@${slackUserId}> is now linked to <${userResponse.data.html_url}|@${userResponse.data.login}>`,
      }],
    });
    res.redirect(`slack://channel?team=${slackTeamId}&channel=${slackChannelId}`);
    // process subscribe
  });
};
