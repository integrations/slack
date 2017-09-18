const moment = require('moment');

const WebClient = require('@slack/client').WebClient;

const token = process.env.SLACK_API_WORKSPACE_TEST_TOKEN;
const web = new WebClient(token);

const { arrayToFormattedString } = require('./helpers');
const { retrieveStoredMetadata, storeMessageMetadata } = require('./storage');

const ISSUE_CLOSED_RED = '#cb2431';
const ISSUE_OPEN_GREEN = '#36a64f';

async function updateIssueMessage(messageMetaData, context) {
  // Fetch updated version of issue to retrieve accurate comment count
  const issue = await context.github.issues.get({
    owner: context.payload.issue.user.login,
    repo: context.payload.repository.name,
    number: context.payload.issue.number,
  });
  const noOfComments = issue.data.comments;

  const createdAt = moment(context.payload.issue.created_at);
  web.chat.update(messageMetaData.ts, messageMetaData.channel, '', { // 3rd argument is required in API wrapper, but not in API (We don't want to use it in this case)
    attachments: [
      {
        'color': context.payload.issue.state === 'open' ? ISSUE_OPEN_GREEN : ISSUE_CLOSED_RED,
        'pretext': `[${context.payload.repository.full_name}] Issue opened by ${context.payload.issue.user.login}`,
        'fallback': `Issue opened by ${context.payload.issue.user.login}`,
        'author_name': context.payload.issue.user.login,
        'author_link': context.payload.issue.user.html_url,
        'author_icon': context.payload.issue.user.avatar_url,
        'title': `#${context.payload.issue.number} ${context.payload.issue.title}`,
        'title_link': context.payload.issue.html_url,
        'text': context.payload.issue.body, // We should truncate markdown that Slack doesn't understand.
        'fields': [
            {
                'title': 'State',
                'value': context.payload.issue.state === 'open' ? ':green_heart: Open' : ':heart: Closed',
                'short': true
            },
            {
                'title': 'Labels',
                'value': arrayToFormattedString(context.payload.issue.labels, 'name'),
                'short': true
            },
            {
                'title': 'Assignees',
                'value': arrayToFormattedString(context.payload.issue.assignees, 'login'),
                'short': true
            },
            {
                'title': 'Comments',
                'value': `<${context.payload.issue.html_url}|:speech_balloon: ${noOfComments}>`,
                'short': true
            },
        ],
        'footer': `<${context.payload.issue.html_url}|View it on GitHub>`,
        'footer_icon': 'https://assets-cdn.github.com/favicon.ico',
        'ts': createdAt.unix(),
        'mrkdwn_in': ['pretext', 'text', 'fields'],
      }
    ]
  }, function(err, res) {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
    }
  });
}

async function matchMetaDataStatetoIssueMessage(context) {
  const id = context.payload.issue.id;
  const storedMetaData = await retrieveStoredMetadata(id);
  const messageMetaData = JSON.parse(storedMetaData);
  updateIssueMessage(messageMetaData, context);
}

async function issueOpened(context) {
  const createdAt = moment(context.payload.issue.created_at);
  web.chat.postMessage('#general', '', { // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
  attachments: [
    {
      color: context.payload.issue.state === 'open' ? ISSUE_OPEN_GREEN : ISSUE_CLOSED_RED,
      pretext: `[${context.payload.repository.full_name}] Issue opened by ${context.payload.issue.user.login}`,
      fallback: `Issue opened by ${context.payload.issue.user.login}`,
      author_name: context.payload.issue.user.login,
      author_link: context.payload.issue.user.html_url,
      author_icon: context.payload.issue.user.avatar_url,
      title: `#${context.payload.issue.number} ${context.payload.issue.title}`,
      title_link: context.payload.issue.html_url,
      text: context.payload.issue.body, // We should truncate markdown that Slack doesn't understand.
      fields: [
        {
          title: 'State',
          value: context.payload.issue.state === 'open' ? ':green_heart: Open' : ':red_heart: Closed',
          short: true
        },
        {
          title: 'Labels',
          value: arrayToFormattedString(context.payload.issue.labels, 'name'),
          short: true
        },
        {
          title: 'Assignees',
          value: arrayToFormattedString(context.payload.issue.assignees, 'login'),
          short: true
        },
        {
          title: 'Comments',
          value: `<${context.payload.issue.comments_url}|:speech_balloon: ${context.payload.issue.comments}>`,
          short: true
        },
      ],
      footer: `<${context.payload.issue.html_url}|View it on GitHub>`,
      footer_icon: 'https://assets-cdn.github.com/favicon.ico',
      ts: createdAt.unix(),
      mrkdwn_in: ['pretext', 'text', 'fields'],
      callback_id: 'test',
      actions: [
        {
          name: 'select_label',
          text: 'Select label',
          type: 'select',
          options: [
            {
              text: 'Bug',
              value: 'bug',
            },
            {
              text: 'Enhancement',
              value: 'enhancement',
            },
          ],
        },
        {
          name: 'assign',
          text: 'Assign',
          type: 'select',
          data_source: 'users',
        },
        {
          name: 'close',
          text: 'Close Issue',
          type: 'button',
          style: 'danger',
        }
      ]
    }
  ]
  }, function(err, res) {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
      const messageMetaData = {
        channel: res.channel,
        ts: res.ts,
      };
      storeMessageMetadata(context.payload.issue.id, messageMetaData);
    }
  });
}

async function issueClosed(context) {
 // New message that says Issue was closed
 // Update existing message
 // One-off 'event' message never gets updated
  const closedAt = moment(context.payload.issue.closed_at);
  web.chat.postMessage('#general', '', { // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
    attachments: [
      {
        'color': ISSUE_CLOSED_RED,
        'pretext': `[${context.payload.repository.full_name}] Issue closed by ${context.payload.sender.login}`,
        'fallback': `Issue closed by ${context.payload.sender.login}`,
        'title': `#${context.payload.issue.number} ${context.payload.issue.title}`,
        'title_link': context.payload.issue.html_url,
        'footer': `<${context.payload.issue.html_url}|View it on GitHub>`,
        'footer_icon': 'https://assets-cdn.github.com/favicon.ico',
        'ts': closedAt.unix(),
        'mrkdwn_in': ['pretext', 'text', 'fields']
      }
    ]
  }, function(err, res) {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
    }
  });

  const id = context.payload.issue.id;
  const storedMetaData = await retrieveStoredMetadata(id);
  const messageMetaData = JSON.parse(storedMetaData);
  updateIssueMessage(messageMetaData, context);
}

async function issueReopened(context) {
  const updatedAt = moment(context.payload.issue.updated_at);
  web.chat.postMessage('#general', '', { // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
    attachments: [
      {
        'color': ISSUE_OPEN_GREEN,
        'pretext': `[${context.payload.repository.full_name}] Issue reopened by ${context.payload.sender.login}`,
        'fallback': `Issue reopened by ${context.payload.sender.login}`,
        'title': `#${context.payload.issue.number} ${context.payload.issue.title}`,
        'title_link': context.payload.issue.html_url,
        'footer': `<${context.payload.issue.html_url}|View it on GitHub>`,
        'footer_icon': 'https://assets-cdn.github.com/favicon.ico',
        'ts': updatedAt.unix(),
        'mrkdwn_in': ['pretext', 'text', 'fields']
      }
    ]
  }, function(err, res) {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
    }
  });

  const id = context.payload.issue.id;
  const storedMetaData = await retrieveStoredMetadata(id);
  const messageMetaData = JSON.parse(storedMetaData);
  updateIssueMessage(messageMetaData, context);
}

module.exports = {
  matchMetaDataStatetoIssueMessage,
  issueOpened,
  issueClosed,
  issueReopened,
};
