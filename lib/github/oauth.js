const oauth = require('github-oauth')({
  githubClient: process.env.GITHUB_CLIENT_ID,
  githubSecret: process.env.GITHUB_SECRET_ID,
  baseURL: process.env.APP_URL,
  loginURI: 'github/oauth/login',
  callbackURI: '/github/oauth/callback',
  scope: '',
});

module.exports = (robot) => {
  // probably can't use the github-oauth library
  oauth.addRoutes(robot.route());

  oauth.on('token', (token, res) => {
    // call api.github.com/user

    // redirect to open slack channel where this request came from slack://
  })
};
