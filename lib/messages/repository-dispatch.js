const moment = require('moment');
const mrkdwn = require('html-to-mrkdwn');

const { Message } = require('.');

// Use cases
// Labeling thing
// pagerduty thing
// DM people
// In second iteration, let people suggest channel id or channel name

// Really custom notifications (customers ask for this)

// Ping usergroup in Slack

// Send to Slack label or send to slack slash command
// Something with timers?

// Run npm audit every morning, report to Slack

// Hey it's been 7 (or n) days or commits since the last release. Maybe release?

// Reminder to merge PR if it's been deployed for a while

// Breakdown every week of how many more stats you have now

module.exports = (payload) => {
  // sender triggerd `action`
  // text for section block
  // context block based on repo
}

class Release extends Message {
  constructor({
    release, repository,
  }) {
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
    });
    this.repository = repository;
    this.release = release;
  }

  getRenderedMessage() {
    const { release, repository } = this;
    const { author } = release;

    const message = {
      ...super.getBaseMessage(),
      title: `Release - ${release.name}`,
      fallback: `[${repository.full_name}] Release - ${release.name}`,
      title_link: release.html_url,
      author_name: author.login,
      author_link: author.html_url,
      author_icon: author.avatar_url,
      ts: moment(release.published_at).unix(),
      mrkdwn_in: ['text'],
    };

    if (release.body_html) {
      const { text, image } = mrkdwn(release.body_html);
      message.text = text;
      message.image_url = image;
    } else {
      message.text = release.body;
    }

    return message;
  }
}

module.exports = {
  Release,
};
