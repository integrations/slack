const {
  constants,
  Message,
} = require('.');

class Status extends Message {
  constructor(checkOrStatus) {
    super({});
    // error, failure, pending, success, queued, in_progress, completed, neutral, cancelled, timed_out, or action_required
    this.overallStatus = checkOrStatus.state || checkOrStatus.conclusion || checkOrStatus.status; 
    this.context = checkOrStatus.context || checkOrStatus.app.name || checkOrStatus.name;
    this.description = checkOrStatus.description || checkOrStatus.output.title || checkOrStatus.name;
    this.avatar_url = checkOrStatus.avatar_url || checkOrStatus.app.owner.avatar_url;
    this.target_url = checkOrStatus.target_url || checkOrStatus.html_url;
  }

  static getStatusColor(status) {
    if (status === 'success') {
      return constants.STATUS_SUCCESS;
    } else if (status === 'pending' || status === 'in_progress' || status === 'queued' || status === 'neutral') {
      return constants.STATUS_PENDING;
    } else if (status === 'failure' || status === 'error') {
      return constants.STATUS_FAILURE;
    }
  }

  static getChecksPassAttachment(successfulChecks, totalChecks) {
    let fallback, color;
    if (successfulChecks === totalChecks) {
      fallback = 'All checks have passed';
      color = constants.STATUS_SUCCESS;
    } else if (successfulChecks > 1) {
      fallback = `${successfulChecks} other checks have passed`;
      color = constants.STATUS_PENDING;
    } else if (successfulChecks === 1) {
      fallback = `${successfulChecks} other check has passed`;
      color = constants.STATUS_PENDING;
    } else if (successfulChecks === 0) {
      fallback = 'No checks have passed';
      color = constants.STATUS_FAILURE
    } 
      
    return {
      color,
      fallback,
      text: `:white_check_mark: ${fallback}`,
      footer: `${successfulChecks}/${totalChecks} successful checks`,
    };
  }

  renderAttachment() {
    const summary = `${this.context}: ${this.description}`;
    return {
      fallback: summary,
      author_name: summary,
      author_icon: this.avatar_url,
      author_link: this.target_url,
      color: this.constructor.getStatusColor(this.overallStatus),
      mrkdwn_in: ['text'],
    };
  }
}

module.exports = {
  Status,
};
