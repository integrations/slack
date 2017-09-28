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
  console.log("WTF?", repository);
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
          context: context.issue(),
        };
        storeMessageMetadata(`status-${context.payload.pull_request.head.sha}`, messageMetaData); // store sha so that status events can be linked back to PR
      }
    },
  );
}

async function onStatus(context) {
  // we should obtain the new PR data, not the old one
  const message = JSON.parse(await retrieveStoredMetadata(`status-${context.payload.sha}`));
  const pull = await context.github.pullRequests.get(message.context);
  const statuses = await context.github.repos.getStatuses(context.repo({
    ref: context.payload.sha,
  }));

  const prBase = createPullRequestBaseMessage(pull.data, pull.data.base.repo);

  statuses.data.forEach((status) => {
    prBase.attachments.push({
      fallback: status.description,
      text: `<${status.target_url}|${status.context}:> ${status.description}`,
      color: getStatusColor(status.state),
      title: status.context,
      title_link: status.target_url,
      mrkdwn_in: ['text'],
    });
  });

  web.chat.update(message.ts, message.channel, '', prBase,
    (err, res) => {
      if (err) {
        console.log('Error:', err);
      } else {
        console.log('Message sent: ', res);
      }
    },
  );
}

module.exports = {
  pullRequestOpened,
  onStatus,
};
