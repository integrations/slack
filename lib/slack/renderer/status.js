const {
  constants,
  Message,
} = require('./index.js');

class Status extends Message {
  constructor(
    status,
  ) {
    super({
      includeFooter: false,
    });
    this.status = status;
  }

  static getStatusColor(status) {
    if (status === 'success') {
      return constants.STATUS_SUCCESS;
    } else if (status === 'pending') {
      return constants.STATUS_PENDING;
    } else if (status === 'failure' || status === 'error') {
      return constants.STATUS_FAILURE;
    }
  }

  renderAttachment() {
    return {
      fallback: this.status.description,
      author_name: this.status.context,
      author_icon: this.status.avatar_url,
      author_link: this.status.target_url,
      text: this.status.description,
      color: this.constructor.getStatusColor(this.status.state),
      mrkdwn_in: ['text'],
    };
  }
}

module.exports = {
  Status,
};
