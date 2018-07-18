const { Comment } = require('../messages/comment');

module.exports = async (context, subscription, channel) => {
  const { repository } = context.payload;

  const issue = context.payload.issue || context.payload.pull_request;

  let { comment } = context.payload;

  // Fetch updated comment to get body_html
  comment = (await context.github.request({
    method: 'GET',
    url: context.payload.comment.url,
    headers: { accept: 'application/vnd.github.html+json' },
  })).data;

  const message = new Comment({ comment, issue, repository });

  return channel.rollup(message, {
    postNewIf: context.payload.action === 'created',
  });
};
