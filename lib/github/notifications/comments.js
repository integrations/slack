const { Comment } = require('../../slack/renderer/comment');

module.exports = (context) => {
  const { issue, comment, repository } = context.payload;

  return {
    attachments: [
      new Comment({ comment, issue, repository }).getRenderedMessage(),
    ],
  };
};
