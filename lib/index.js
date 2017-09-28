const bodyParser = require('body-parser');
const GitHubApi = require('github');

const { WebClient } = require('@slack/client');
const { createSlackEventAdapter } = require('@slack/events-api');

const slack = {
  web: new WebClient(process.env.SLACK_ACCESS_TOKEN),
  events: createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN),
};

const {
  matchMetaDataStatetoIssueMessage,
  issueOpened,
  issueClosed,
  issueReopened,
} = require('./issues');

const unfurl = require('./unfurl');

const {
  pullRequestOpened,
  onStatus,
  storePRMapping,
} = require('./pullRequests');

module.exports = (robot) => {
  robot.on('issues.opened', issueOpened);
  robot.on([
    'issues.labeled',
    'issues.unlabeled',
    'issues.assigned',
    'issues.unassigned',
    'issue_comment',
  ], matchMetaDataStatetoIssueMessage);

  robot.on('issues.closed', issueClosed);
  robot.on('issues.reopened', issueReopened);
  robot.on('pull_request.opened', pullRequestOpened);
  robot.on(['pull_request.opened', 'pull_request.synchronize'], storePRMapping);
  robot.on('status', onStatus);

  const app = robot.route();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Mount the event handler on a route
  app.use('/slack/events', slack.events.expressMiddleware());

  // Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
  slack.events.on('link_shared', (event) => {
    robot.log({ slack: event }, 'Slack event received');

    const github = new GitHubApi();
    const unfurls = {};
    event.links.forEach(async (link) => {
      unfurls[link.url] = await unfurl(github, link.url);
      robot.log.trace(unfurls, 'Unfurling links');
      slack.web.chat.unfurl(
        event.message_ts,
        event.channel,
        unfurls,
        (err, slackRes) => {
          if (err) {
            robot.log.error(err);
          } else {
            robot.log.trace(slackRes, 'Unfurl complete');
          }
        },
      );
    });
  });

  // Handle errors (see `errorCodes` export)
  slack.events.on('error', robot.log.error);
};
