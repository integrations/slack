const models = require('./db/models');
const setupSlack = require('./slack');
const setupGitHub = require('./github');
const path = require('path');
const express = require('express');

module.exports = (robot) => {
  // eslint-disable-next-line no-param-reassign
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
      slackState: 'make-me-random',
    });
  });

  robot.route().get('/boom', () => {
    throw new Error('Boom');
  });
};
