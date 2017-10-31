const moment = require('moment');

const {
  Message,
} = require('./index');

class Repository extends Message {
  constructor(constructorObject) {
    super({
      includeFooter: true,
      footerURL: constructorObject.repository.html_url,
    });
    this.repository = constructorObject.repository;
  }

  getFields() {
    const fields = [
      {
        title: 'Website',
        value: this.repository.homepage,
      },
      {
        title: 'Watchers',
        value: this.repository.subscribers_count,
      },
      {
        title: 'Stars',
        value: this.repository.stargazers_count,
      },
      {
        title: 'Forks',
        value: this.repository.network_count,
      },
      {
        title: 'Last updated',
        value: moment(this.repository.updated_at).fromNow(),
      },
      {
        title: 'Language',
        value: this.repository.language,
      },
    ];

    return this.constructor.cleanFields(
      fields,
      Infinity,
    );
  }

  getRenderedMessage() {
    return {
      ...super.getBaseMessage(),
      color: this.constructor.getColor(),
      fallback: this.repository.full_name,
      title: this.repository.full_name,
      text: this.repository.description,
      fields: this.getFields(),
      mrkdwn_in: ['text', 'fields'],
      ts: moment(this.repository.created_at).unix(),
    };
  }
}

module.exports = {
  Repository,
};
