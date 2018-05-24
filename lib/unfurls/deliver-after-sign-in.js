const {
  Unfurl,
  GitHubUser,
  SlackUser,
  SlackWorkspace,
} = require('../models');
const { NotFound } = require('../messages/flow');
const logger = require('../logger');

async function deliverAfterSignIn(unfurlId) {
  const storedUnfurl = await Unfurl.findById(unfurlId, { include: [SlackUser, SlackWorkspace] });
  const slackUser = storedUnfurl.SlackUser;
  await slackUser.reload({ include: [GitHubUser] });

  let repoId;
  try {
    ({ repoId } = await Unfurl.isPrivate(slackUser.GitHubUser.client, storedUnfurl.url));
  } catch (err) {
    if (err.name === 'ResourceNotFound') {
      logger.debug({
        url: storedUnfurl.url,
        slackWorkspace: storedUnfurl.SlackWorkspace.slackId,
        slackUser: storedUnfurl.SlackUser.slackId,
      }, 'Could not unfurl resource. User may not have access');
      await storedUnfurl.SlackWorkspace.client.chat.postEphemeral({
        channel: storedUnfurl.channelSlackId,
        user: storedUnfurl.SlackUser.slackId,
        ...new NotFound(storedUnfurl.url).toJSON(),
      });
      return storedUnfurl.destroy();
    }
    throw err;
  }
  await storedUnfurl.update({
    githubRepoId: repoId,
  });

  return storedUnfurl.deliver();
}

module.exports = {
  deliverAfterSignIn,
};
