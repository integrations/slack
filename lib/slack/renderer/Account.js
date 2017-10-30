const moment = require('moment');

const {
  Message,
} = require('./index');

class Account extends Message {
  constructor(constructorObject) {
    super({
      includeFooter: true,
      footerURL: constructorObject.account.html_url,
    });
    this.account = constructorObject.account;
  }

  getFields() {
    const fields = [
      {
        title: 'Company',
        value: this.account.company,
      },
      {
        title: 'Location',
        value: this.account.location,
      },
      {
        title: 'URL',
        value: this.account.blog,
      },
      {
        title: 'Repositories',
        value: this.account.public_repos,
      },
      {
        title: 'Followers',
        value: this.account.followers,
      },
    ];

    return this.constructor.cleanFields(
      fields,
      4,
    );
  }

  getRenderedMessage() {
    return {
      ...super.getBaseMessage(),
      color: this.constructor.getColor(),
      fallback: this.account.name,
      title: this.account.name,
      text: this.account.bio,
      thumb_url: this.account.avatar_url,
      fields: this.getFields(),
      ts: moment(this.account.created_at).unix(),
    };
  }
}

module.exports = {
  Account,
};
