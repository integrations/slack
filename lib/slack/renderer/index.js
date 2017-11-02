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
    this.includeFooter = constructorObject.includeFooter;
    this.footerURL = constructorObject.footerURL;
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

  getBaseMessage() {
    const baseMessage = {
      color: constants.GITHUB_BLACK,
    };
    if (this.includeFooter) {
      baseMessage.footer = `<${this.footerURL}|View it on GitHub>`;
      baseMessage.footer_icon = 'https://assets-cdn.github.com/favicon.ico';
    }
    return baseMessage;
  }

}

// TODO: /github test-run -> delivers all webhooks we're currently ready to receive

module.exports = {
  Message,
  constants,
};
