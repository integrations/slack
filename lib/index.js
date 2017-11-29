const models = require('./db/models');
const setupSlack = require('./slack');
const setupGitHub = require('./github');
const path = require('path');
const express = require('express');

module.exports = (robot) => {
  /* eslint-disable no-param-reassign */
  robot.models = models(robot);

  setupSlack(robot);
  setupGitHub(robot);

  const frontend = express();
  robot.route().use(frontend);
  frontend.set('view engine', 'hbs');
  frontend.set('views', path.join(__dirname, '/views'));

  frontend.get('/', (req, res) => {
    res.render('index.hbs', {
      slackClientId: process.env.SLACK_CLIENT_ID,
      // @todo: Implement state enforcement logic in time for the private beta
      slackState: 'make-me-random',
    });
  });

  robot.route().get('/boom', () => {
    throw new Error('Boom');
  });

  // Fetch and cache info about the GitHub App
  robot.info = async function info() {
    const github = await this.auth();
    const res = await github.apps.get({});

    // Override info method with cached data
    this.info = async () => res.data;

    return res.data;
  };
};
