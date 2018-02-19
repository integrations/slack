const installations = require('./installations');
const router = require('./router');

const {
  matchMetaDataStatetoIssueMessage,
  issueEvent,
} = require('./notifications/issues');


const {
  pullRequestEvent,
  onStatus,
  storePRMapping,
} = require('./notifications/pullRequests');

const { deploymentStatus } = require('./notifications/deployments');
const { push } = require('./notifications/push');
const { publicEvent } = require('./notifications/public');
const comments = require('./notifications/comments');
const ref = require('./notifications/ref');
const review = require('./notifications/review');

const oauth = require('./oauth');

module.exports = (robot) => {
  // Track installations
  installations(robot);

  // set up GitHub oauth
  oauth(robot);

  const app = robot.route('/github');

  app.get('/setup', async (req, res) => {
    const { SlackUser, PendingCommand } = robot.models;
    const user = await SlackUser.findById(req.session.slackUserId);

    if (await PendingCommand.find(user.slackId)) {
      res.redirect('/slack/command');
    } else {
      res.render('OMG REDIRECT TO SLACK NOW');
      // res.redirect(`slack://channel?team=${slackTeamId}&channel=${slackChannelId}`);
    }
  });

  const route = router(robot);

  robot.on(['issues.opened', 'issues.closed', 'issues.reopened'], route(issueEvent));

  robot.on([
    'issues.labeled',
    'issues.unlabeled',
    'issues.assigned',
    'issues.unassigned',
    'issue_comment',
  ], route(matchMetaDataStatetoIssueMessage));

  robot.on(['pull_request.opened', 'pull_request.closed', 'pull_request.reopened'], route(pullRequestEvent));
  robot.on(['pull_request.opened', 'pull_request.synchronize'], storePRMapping);
  robot.on('status', route(onStatus));
  robot.on('deployment_status', route(deploymentStatus));
  robot.on('push', route(push));
  robot.on('public', route(publicEvent));

  robot.on('issue_comment', route(comments));

  robot.on(['create', 'delete'], route(ref));
  robot.on(['pull_request_review.submitted', 'pull_request_review.edited'], route(review));
};
