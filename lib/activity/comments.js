const { JSDOM } = require('jsdom');
const cache = require('../cache');
const { Comment } = require('../messages/comment');

// Extract just the hostname out of SLACK_ROOT_URL
const slackDomain = JSDOM.fragment(`<a href="${process.env.SLACK_ROOT_URL}">test</a>`).firstChild.hostname;

module.exports = async (context, subscription, slack) => {
  const { repository } = context.payload;

  const issue = context.payload.issue || context.payload.pull_request;

  let { comment } = context.payload;

  // Fetch updated comment to get body_html
  comment = (await context.github.request({
    method: 'GET',
    url: context.payload.comment.url,
    headers: { accept: 'application/vnd.github.html+json' },
  })).data;

  // HACK: Only unfurl on new comments (so we do not keep unfurling)
  if (context.payload.action === 'created') {
    // Check if the comment contains a Slack Link.
    // Slack links are of the form `https://{team}.slack.com/archives/{channel}/p##########000000`
    const slackLinks = [];
    const frag = JSDOM.fragment(comment.body_html);
    frag.querySelectorAll('a').forEach((a) => {
      if (a.hostname.endsWith(slackDomain)) {
        const [channelId, ts] = a.pathname.split('/').slice(2);
        slackLinks.push({ channelId, ts, href: a.href });
      }
    });
    slackLinks.forEach(({ channelId, ts, href }) => {
      // Post a message asking the channel to confirm unfurling
      // TODO: use slack.chat.postEphemeral if we can authenticate
      // the Slack User and they are in the channel
      const attachments = [
        {
          text: 'Should the link be unfurled?',
          fallback: 'Slack link unfurling on GitHub is not supported in this client',
          color: '#3AA3E3',
          // The Slack Message link is encoded with hyphens here
          callback_id: `slackunfurl-${channelId}-${ts}`,
          attachment_type: 'default',
          actions: [
            {
              type: 'button',
              name: 'slackunfurl-slack-message-accept',
              text: 'Accept',
              // The GitHub information for the comment is encoded here
              value: JSON.stringify({
                githubId: subscription.Installation.githubId,
                issueCommentUrl: comment.url,
              }),
              confirm: {
                title: 'Are you sure?',
                text: 'It will be visible to people that are not memebers of this Slack Channel',
                ok_text: 'Yes',
                dismiss_text: 'No',
              },
            },
            {
              type: 'button',
              name: 'slackunfurl-slack-message-reject',
              text: 'Reject',
              value: 'slackunfurl-slack-message-reject-yes',
            },
          ],
        },
      ];
      slack.chat.postMessage({
        channel: channelId,
        text: `${comment.user.login} posted a comment at <${comment.html_url}|${context.payload.repository.full_name}#${context.payload.issue.number}> that links to a <${href}|Slack message> in this channel.\n*Note:* The message will become visible on GitHub`,
        unfurl_links: false,
        unfurl_media: false,
        attachments,
      });
    });
  }

  const attachments = [
    new Comment({ comment, issue, repository }).getRenderedMessage(),
  ];

  const cacheKey = subscription.cacheKey(`comment#${context.payload.comment.id}`);
  const storedMetaData = await cache.get(cacheKey);

  if (storedMetaData) {
    const { ts, channel } = storedMetaData;
    const res = await slack.chat.update({ ts, channel, attachments });
    context.log(res, 'Updated Slack message');
  } else if (context.payload.action === 'created') {
    const res = await slack.chat.postMessage({ channel: subscription.channelId, attachments });
    context.log(res, 'Posted Slack message');
    const messageMetaData = {
      channel: res.channel,
      ts: res.ts,
    };
    await cache.set(cacheKey, messageMetaData);
  }
};
