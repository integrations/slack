const moment = require('moment');
const mrkdwn = require('html-to-mrkdwn');

const { Message } = require('.');

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
      title: `[${repository.full_name}] Release - ${release.name} (${release.tag_name})`,
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
