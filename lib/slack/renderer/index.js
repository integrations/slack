const constants = {
  GITHUB_BLACK: '#24292f',
  CLOSED_RED: '#cb2431',
  OPEN_GREEN: '#36a64f',
  MERGED_PURPLE: '#6f42c1',
  STATUS_SUCCESS: '#28a745',
  STATUS_PENDING: '#dbab09',
  STATUS_FAILURE: '#cb2431',
  BASE_ATTACHMENT_COLOR: '#24292f',
  ATTACHMENT_FIELD_LIMIT: 2,
  MAJOR_MESSAGES: {
    'pull_request.opened': true,
    'issues.opened': true,
  },
};

class Message {
  constructor(constructorObject) {
    this.footerURL = constructorObject.footerURL;
    this.footer = constructorObject.footer;
    this.includeAuthor = constructorObject.includeAuthor;
    this.author = constructorObject.author;
  }

  static cleanFields(
    fields,
    fieldLimit = constants.ATTACHMENT_FIELD_LIMIT,
    short = true,
  ) {
    return fields
      .filter(field => field.value)
      .map((field) => {
        if (short) {
          return { ...field, short: true };
        }
        return { ...field };
      })
      .slice(0, fieldLimit);
  }

  static convertToCondensedAttachment(attachment) {
    const condensedAttachment = {
      ...attachment,
    };
    if (condensedAttachment.fields) {
      condensedAttachment.fields = attachment.fields.slice(0, 2);
    }
    delete condensedAttachment.text;
    return condensedAttachment;
  }

  getBaseMessage() {
    const baseMessage = {
      color: constants.GITHUB_BLACK,
    };
    if (this.footer) {
      baseMessage.footer = this.footer;
      baseMessage.footer_icon = 'https://assets-cdn.github.com/favicon.ico';
    }
    if (this.includeAuthor) {
      baseMessage.author_name = this.author.login;
      baseMessage.author_icon = this.author.avatarURL;
      baseMessage.author_link = this.author.htmlURL;
    }
    return baseMessage;
  }
}

// TODO: /github test-run -> delivers all webhooks we're currently ready to receive

module.exports = {
  Message,
  constants,
};
