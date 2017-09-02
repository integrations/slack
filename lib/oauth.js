const oauth = require('github-oauth')({
  githubClient: process.env.GITHUB_CLIENT_ID,
  githubSecret: process.env.GITHUB_CLIENT_SECRET,
  baseURL: process.env.APP_URL,
  loginURI: '/github/login',
  callbackURI: '/github/callback'
})

module.exports = robot => {
  oauth.addRoutes(robot.route())

  oauth.on('token', function (token, serverResponse) {
    console.log('here is your shiny new github oauth token', token)
    serverResponse.end(JSON.stringify(token))

    // const github = new GitHubAPI()
    // github.authenticate({type: 'token', token: token.access_token})
    // github.users.get({}).then(robot.log);
  })
}
