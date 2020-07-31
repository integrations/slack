const express = require('express');
const path = require('path');
const crypto = require('crypto');
const queryString = require('query-string');

const githubUrl = require('./github-url');
const SignedParams = require('./signed-params');

const app = express();

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use('/static', express.static(path.join(__dirname, '..', 'static')));

app.get('/', (req, res) => {
  res.render('index.hbs', { year: new Date().getFullYear() });
});

app.get('/github/oauth/login', async (req, res) => {
  if (!req.query.state) {
    return res.status(400).send('Error: State parameter was not provided');
  }

  let state;
  try {
    state = await SignedParams.load(req.query.state);
  } catch (err) {
    if (err.name && err.name === 'JsonWebTokenError') {
      return res.status(400).send(`Error: ${err.message}`);
    } else if (err.name && err.name === 'TokenExpiredError') {
      return res.status(400).send('Error: The time window to connect your GitHub account has expired. Please return to Slack to re-start the process of connecting your GitHub account.');
    }
    throw err;
  }

  const {
    trigger_id,
    teamSlackId,
    teamSlackDomain,
    userSlackId,
    channelSlackId,
    replaySlashCommand,
    actionCallbackId,
  } = state;

  // Set session cookie with oauth state that we can verify it in the OAuth callback
  const githubOAuthState = crypto.randomBytes(15).toString('hex');
  req.session.githubOAuthState = githubOAuthState;

  const params = {
    client_id: process.env.GITHUB_CLIENT_ID,
    state: await new SignedParams({
      trigger_id,
      teamSlackId,
      userSlackId,
      channelSlackId,
      replaySlashCommand,
      actionCallbackId,
      githubOAuthState,
    }).stringify(),
  };

  res.render('confirm-login.hbs', {
    year: new Date().getFullYear(),
    teamSlackDomain,
    continueLink: githubUrl.resolve(`/login/oauth/authorize?${queryString.stringify(params)}`),
  });
});

module.exports = app;
