const moment = require('moment');

const {
  Message,
  constants,
} = require('.');

class Review extends Message {
  constructor({
    review, pull_request, repository, sender,
  }) {
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
      author: {
        login: sender.login,
        avatarURL: sender.avatar_url,
        htmlURL: sender.html_url,
      },
    });
    this.review = review;
    this.pull = pull_request;
    this.sender = sender;

    if (this.review.state === 'approved') {
      this.color = constants.OPEN_GREEN;
      this.middle = 'approved';
    } else if (this.review.state === 'changes_requested') {
      this.color = constants.CLOSED_RED;
      this.middle = 'requested changes on';
    } else {
      this.middle = 'commented on';
    }
  }

  toJSON() {
    const pretext = `${this.sender.login} ${this.middle} pull request`;

    const baseMessage = {
      ...super.getBaseMessage(),
      pretext,
      fallback: pretext,
      title: `Review on #${this.pull.number} ${this.pull.title}`,
      title_link: this.review.html_url,
      text: this.review.body,
      mrkdwn_in: ['text'],
      ts: moment(this.review.submitted_at).unix(),
    };
    if (this.color) {
      baseMessage.color = this.color;
    }
    return baseMessage;
  }
}

module.exports = {
  Review,
};
