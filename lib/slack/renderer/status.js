const {
  constants,
  Message,
} = require('./index.js');

class Status extends Message {
  constructor(status) {
    super({});
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

  static getChecksPassAttachment(successfulChecks, totalChecks) {
    let fallback;
    if (successfulChecks === totalChecks) {
      fallback = 'All checks have passed';
    } else {
      fallback = `${successfulChecks} other checks have passed`;
    }
    return {
      color: constants.STATUS_SUCCESS,
      fallback,
      text: `:white_check_mark: ${fallback}`,
      footer: `${successfulChecks}/${totalChecks} successful checks`,
    };
  }

  renderAttachment() {
    const summary = `${this.status.context}: ${this.status.description}`;
    return {
      fallback: summary,
      author_name: summary,
      author_icon: this.status.avatar_url,
      author_link: this.status.target_url,
      color: this.constructor.getStatusColor(this.status.state),
      mrkdwn_in: ['text'],
    };
  }
}

module.exports = {
  Status,
};
