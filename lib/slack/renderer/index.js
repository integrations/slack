const constants = {
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

// class Message {
//   constructor(GitHubObjectType, unfurl = false) {
//     this.gitHubObjectType = GitHubObjectType;
//     this.unfurl = unfurl;
//   }
//
//   renderAndGet() {
//     // need seperate logic in here for single unfurl attachment and multiple attachments
//     return {
//       attachments: [
//         this.attachment,
//       ],
//     };
//   }
//
// }

// TODO: /github test-run -> delivers all webhooks we're currently ready to receive

module.exports = {
  // Message,
  constants,
};
