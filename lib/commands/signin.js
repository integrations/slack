const url = require('url');

const { SignIn } = require('../messages/flow');

const SignedParams = require('../signed-params');

// @todo should also be able to sign out (/github signout)
module.exports = {
  name: 'signin',
  async action(command) {
    const state = new SignedParams({
      trigger_id: command.context.trigger_id,
    });

    const link = url(command.url);
    link.pathname = '/github/oauth/login';
    link.search = `state=${await state.stringify()}`;

    // returns slack message with link to click
    return command.respond((new SignIn(link.href)));
  },
};
