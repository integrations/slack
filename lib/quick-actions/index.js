const { Unfurl } = require('../models');

/* eslint-disable global-require */
const githubTypes = {
  repo: require('./repo'),
};


async function postQuickActions({
  slackUser,
  slackWorkspace,
  channelId,
  command,
  robot,
}) {
  // get last 3 things in channel and send 3 attachments each with quick actions

  // first up: for repo: subscribe, unsubscribe
  // available if part of unfurl
  // only show each button if that action can actually be taken

  // Load last 3 things from both subscription deliveries and unfurls,
  // order them by recency, then cut off to the last 3
  // Based on type we send off this request to another module

  // Individual attachments contain a title and one or multiple actions (buttons or menus)

  const recentUnfurls = await Unfurl.findAll({
    where: {
      slackWorkspaceId: slackWorkspace.id,
      channelSlackId: channelId,
    },
    limit: 3,
    order: [['createdAt', 'DESC']],
  });

  let attachments = await Promise.all(recentUnfurls.map((recentUnfurl) => {
    console.log(recentUnfurl.githubType);
    if (!githubTypes[recentUnfurl.githubType]) {
      // Resource is not yet supported
      return Promise.resolve();
    }
    return githubTypes[recentUnfurl.githubType](
      recentUnfurl,
      slackUser,
      slackWorkspace,
      channelId,
      robot,
    );
  }));

  attachments = attachments.filter(attachment => attachment);

  if (command) {
    return command.respond({ attachments });
  }
}

module.exports = {
  postQuickActions,
};
