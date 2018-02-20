// superagent plugin to make the request appear to come from slackbot.
//
// Usage:
//
//   const request = require('supertest')
//   request(server).get('/slack/commmand').use(slackbot)
//
// See https://api.slack.com/robots
module.exports = (request) => {
  request.set('User-Agent', 'Slackbot 1.0 (+https://api.slack.com/robots)');
  request.set('Accept', 'application/json,*/*');

  return request;
};
