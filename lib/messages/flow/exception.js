const supportLink = require('../../support-link');

module.exports = class Exception {
  constructor(errorCode) {
    this.link = supportLink({
      comments: `Tell us a little more about what happened and include the error code below.\n\nError code: ${errorCode}`,
    });
  }

  toJSON() {
    return {
      response_type: 'ephemeral',
      attachments: [
        {
          text: 'Sorry, we had trouble with your request, but we\'re looking into it! ' +
            `If this is interfering with your work, please <${this.link}|get in touch>!`,
          color: 'danger',
          mrkdwn_in: ['text'],
        },
      ],
    };
  }
};
