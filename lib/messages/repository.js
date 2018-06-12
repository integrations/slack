const moment = require('moment');

const {
  Message,
} = require('./index');

class Repository extends Message {
  constructor({ repository, unfurlType }) {
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
    });
    this.repository = repository;
    this.unfurlType = unfurlType;
  }

  getFields() {
    const fields = [
      {
        title: 'Website',
        value: this.repository.homepage,
      },
      {
        title: 'Stars',
        value: this.repository.stargazers_count,
      },
      {
        title: 'Language',
        value: this.repository.language,
      },
      {
        title: 'Last updated',
        value: moment(this.repository.updated_at).fromNow(),
      },
      {
        title: 'Forks',
        value: this.repository.network_count,
      },
    ];

    return this.constructor.cleanFields(
      fields,
      2,
    );
  }

  getRenderedMessage() {
    const baseMessage = {
      ...super.getBaseMessage(),
      fallback: this.repository.full_name,
      title: this.repository.full_name,
      text: this.repository.description,
      fields: this.getFields(),
      mrkdwn_in: ['text', 'fields'],
      ts: moment(this.repository.created_at).unix(),
    };
    if (this.unfurlType === 'condensed') {
      return this.constructor.convertToCondensedAttachment(baseMessage);
    }
    return baseMessage;
  }
}

module.exports = {
  Repository,
};
