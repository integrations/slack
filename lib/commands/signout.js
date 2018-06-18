const { SignOut } = require('../messages/flow');

const SignedParams = require('../signed-params');
const getProtocolAndHost = require('../get-protocol-and-host');
const getRepositories = require('../github/get-repositories');
const { Subscription } = require('../models');
const ReEnableMultipleSubscriptions = require('../messages/flow/re-enable-multiple-subscriptions');

module.exports = async (req, res) => {
  const {
    slackUser,
    slackWorkspace,
    command,
    robot,
  } = res.locals;

  const deletedSubscriptions = await slackUser.signout();

  if (deletedSubscriptions) {
    const subscriptionsByChannel = Subscription.groupByChannel(deletedSubscriptions);

    await Promise.all(Object.keys(subscriptionsByChannel).map(async (channel) => {
      const subscriptions = subscriptionsByChannel[channel];
      const repositories = await getRepositories(subscriptions, robot);
      if (repositories) {
        const attachment = new ReEnableMultipleSubscriptions(repositories, slackUser.slackId, 'disconnected their GitHub account').getAttachment();
        return slackWorkspace.client.chat.postMessage({
          channel,
          attachments: [attachment],
        });
      }
    }));
  }

  const state = new SignedParams({
    trigger_id: command.trigger_id,
  });

  const { protocol, host } = getProtocolAndHost(req);

  const signInLink =
    `${protocol}://${host}/github/oauth/login?state=${await state.stringify()}`;
  return command.respond((new SignOut(signInLink, req.body.user_id)));
};
