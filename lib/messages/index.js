const constants = {
  ATTACHMENT_FIELD_LIMIT: 2,
  BASE_ATTACHMENT_COLOR: '#24292f',
  CLOSED_RED: '#cb2431',
  GITHUB_BLACK: '#24292f',
  MAJOR_MESSAGES: {
    'issues.opened': true,
    'pull_request.opened': true,
  },
  MERGED_PURPLE: '#6f42c1',
  OPEN_GREEN: '#36a64f',
  STATUS_FAILURE: '#cb2431',
  STATUS_PENDING: '#dbab09',
  STATUS_SUCCESS: '#28a745',
};

function getChannelString(channelId) {
  switch (channelId[0]) {
    default:
      return `<#${channelId}> `;
    case 'D':
    case 'G':
      return '';
  }
}

class Message {
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
    delete condensedAttachment.author_name;
    delete condensedAttachment.author_icon;
    delete condensedAttachment.author_link;
    return condensedAttachment;
  }

  constructor({ footer, author }) {
    this.footer = footer;
    this.author = author;
  }

  getBaseMessage() {
    const baseMessage = {
      color: constants.GITHUB_BLACK,
    };
    if (this.footer) {
      baseMessage.footer = this.footer;
      baseMessage.footer_icon = 'https://assets-cdn.github.com/favicon.ico';
    }
    if (this.author) {
      baseMessage.author_name = this.author.login;
      baseMessage.author_icon = this.author.avatarURL;
      baseMessage.author_link = this.author.htmlURL;
    }
    return baseMessage;
  }
}

module.exports = {
  Message,
  getChannelString,
  constants,
};
