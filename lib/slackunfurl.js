const { SlackWorkspace } = require('./models');

let robot = null;

function hackSetupSlackUnfurl(r) {
  robot = r;
}

async function slackUnfurlAction(req, res, next) {
  if (!req.body.callback_id.startsWith('slackunfurl-')) {
    return next();
  }

  if (req.body.actions[0].name === 'slackunfurl-slack-message-accept') {
    const [channelId, timestamp] = req.body.callback_id.split('-').slice(1);

    // Reformat the timestamp to be of the form `1476909142.000007`
    // It is currently in the form `p1476909142000007`
    const ts = `${timestamp.substring(1, timestamp.length - 6)}.${timestamp.substring(timestamp.length - 6)}`;

    // Load the Slack workspace client
    const workspace = await SlackWorkspace.findOne({
      where: { slackId: req.body.team.id },
    });

    // Load the Slack Message
    const historyArgs = {
      channel: channelId,
      latest: ts,
      inclusive: true,
      count: 1,
    };
    let history;
    // TODO: Surely there is a better way to determine the Slack Channel type
    // `workspace.client.conversations.history(...)` yields a not_allowed_token_type
    if (channelId.startsWith('D')) {
      history = await workspace.client.im.history(historyArgs);
    } else if (channelId.startsWith('C')) {
      history = await workspace.client.channels.history(historyArgs);
    } else {
      throw new Error(`Unsupported channel type ${channelId[0]}`);
    }
    const { messages } = history;
    req.log.info(messages[0], 'Found message in history');


    // Load the GitHub client
    const payload = JSON.parse(req.body.actions[0].value);
    const github = await robot.auth(payload.githubId);

    // Update the comment
    if (payload.issueCommentUrl) {
      req.log.info(payload.issueCommentUrl, 'Unfurling Slack link');
      const comment = (await github.request({
        method: 'GET',
        url: payload.issueCommentUrl,
      })).data;

      const unfurled = messages[0].text.split('\n').map(line => `> ${line}`).join('\n');
      await github.request({
        method: 'PATCH',
        url: payload.issueCommentUrl,
        body: `${comment.body}\n\n${unfurled}`,
      });
    } else {
      // Could also be Issue Body or Pull Request Body
      throw new Error('Only comments are supported in Slack Unfurling for now');
    }
  }

  // Done. Delete the prompt in the channel
  return res.send({
    delete_original: true,
  });
}

module.exports = {
  hackSetupSlackUnfurl,
  slackUnfurlAction,
};
