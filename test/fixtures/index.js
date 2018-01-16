/* eslint-disable global-require */
const querystring = require('querystring');

module.exports = {
  app: require('./app'),
  issue: require('./issue'),
  pull: require('./pull'),
  comment: require('./comment'),
  contents: require('./contents'),
  user: require('./user'),
  org: require('./org'),
  repo: require('./repo'),
  slack: {
    link_shared: require('./slack/link_shared'),
    command: require('./slack/command'),
    team: {
      info: require('./slack/team.info'),
    },
    oauth: {
      token: require('./slack/oauth.token'),
    },
  },
  github: {
    oauth: querystring.stringify({
      access_token: 'testing123',
      token_type: 'bearer',
    }),
  },
};
