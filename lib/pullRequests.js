const moment = require('moment');

const WebClient = require('@slack/client').WebClient;

const token = process.env.SLACK_API_WORKSPACE_TEST_TOKEN;
const web = new WebClient(token);

const {
  arrayToFormattedString,
  getHexColorbyState,
  getFormattedState,
  getStatusColor,
} = require('./helpers');

const { retrieveStoredMetadata, storeMessageMetadata } = require('./storage');

function createPullRequestBaseMessage(pull, repository) {
  return {
    attachments: [
      {
        fallback: `Pull Request opened by ${pull.user.login}`,
        pretext: `[${repository.full_name}] Pull Request opened by ${pull.user.login}`,
        text: [
          `${pull.commits} commit${pull.commits !== 1 ? 's' : ''}`,
          `into \`${pull.base.label}\``,
          `from \`${pull.head.label}\`\n`,
          `${pull.additions} addition${pull.additions !== 1 ? 's' : ''},`,
          `${pull.deletions} deletion${pull.deletions !== 1 ? 's' : ''},`,
          `${pull.changed_files} file${pull.changed_files !== 1 ? 's' : ''} changed`,
        ].join(' '),
        mrkdwn_in: ['text'],
      },
      {
        color: getHexColorbyState(
          pull.state,
          pull.merged,
        ),
        author_name: pull.user.login,
        author_link: pull.user.html_url,
        author_icon: pull.user.avatar_url,
        title: `#${pull.number} ${pull.title}`,
        title_link: pull.html_url,
        text: pull.body, // We should truncate markdown that Slack doesn't understand.
        fields: [
          {
            title: 'State',
            value: getFormattedState(pull.state, pull.merged),
            short: true,
          },
          {
            title: 'Assignees',
            value: arrayToFormattedString(pull.assignees, 'login'),
            short: true,
          },
          {
            title: 'Comments',
            value: `<${pull.comments_url}|:speech_balloon: ${pull.comments}>`,
            short: true,
          },
        ],
        footer: `<${pull.html_url}|View it on GitHub>`,
        footer_icon: 'https://assets-cdn.github.com/favicon.ico',
        ts: moment(pull.created_at).unix(),
        mrkdwn_in: ['pretext', 'text', 'fields'],
      },
    ],
  };
}

async function pullRequestOpened(context) {
  const prBase = createPullRequestBaseMessage(
    context.payload.pull_request,
    context.payload.repository,
  );
  web.chat.postMessage('#general', '', prBase, // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
    (err, res) => {
      if (err) {
        console.log('Error:', err);
      } else {
        console.log('Message sent: ', res);
        const messageMetaData = {
          channel: res.channel,
          ts: res.ts,
          content: prBase, // remove me! We shouldn't store this :(
        };
        storeMessageMetadata(`status-${context.payload.pull_request.head.sha}`, messageMetaData); // store sha so that status events can be linked back to PR
      }
    },
  );
}

async function status(context) {
  // we should obtain the new PR data, not the old one
  const message = JSON.parse(await retrieveStoredMetadata(`status-${context.payload.sha}`));
  let noMatchingStatusAttachment = true;
  if (message.content.attachments.length > 2) {
    const statusAttachments = message.content.attachments.slice(2);
    for (let i = 0; i < statusAttachments.length; i += 1) {
      if (statusAttachments[i].title === context.payload.context) {
        noMatchingStatusAttachment = false;
        message.content.attachments[i + 2].fallback = context.payload.description;
        message.content.attachments[i + 2].text = context.payload.description;
        message.content.attachments[i + 2].color = getStatusColor(context.payload.state);
        message.content.attachments[i + 2].title_link = context.payload.target_url;
      }
    }
  }
  if (noMatchingStatusAttachment) {
    message.content.attachments.push({
      fallback: context.payload.description,
      author_name: 'Travis CI',
      author_icon: 'https://avatars1.githubusercontent.com/u/1412172?v=4&s=40',
      color: getStatusColor(context.payload.state),
      text: context.payload.description,
      title: context.payload.context,
      title_link: context.payload.target_url,
    });
  }
  console.dir(message.content);
  web.chat.update(message.ts, message.channel, '', message.content,
    (err, res) => {
      if (err) {
        console.log('Error:', err);
      } else {
        console.log('Message sent: ', res);
        const messageMetaData = {
          channel: res.channel,
          ts: res.ts,
          content: message.content, // remove me! We shouldn't store this :(
        };
        storeMessageMetadata(`status-${context.payload.sha}`, messageMetaData); // store sha so that status events can be linked back to PR
      }
    },
  );
}

module.exports = {
  pullRequestOpened,
  status,
};
