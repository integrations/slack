const {
  Message,
} = require('..');

module.exports = class CommentCreated extends Message {
  constructor(commentUrl) {
    super({});
    this.commentUrl = commentUrl;
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      text: `:white_check_mark: Comment successfully created: ${this.commentUrl}`,
    };
  }
};
