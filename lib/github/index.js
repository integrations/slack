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

const SignedParams = require('../signed-params');

module.exports = (robot) => {
  // Track installations
  installations(robot);

  // set up GitHub oauth
  oauth(robot);

  const app = robot.route('/github');

  app.get('/install/:id/:state', async (req, res) => {
    const { trigger_id } = await SignedParams.load(req.params.state);
    req.session.trigger_id = trigger_id;
    const info = await robot.info();

    req.log({ trigger_id, owner_id: req.params.id }, 'Redirecting to install GitHub APP');
    res.redirect(`${info.html_url}/installations/new/permissions?target_id=${req.params.id}`);
  });

  const slackAppUrl = `https://slack.com/app_redirect?app=${process.env.SLACK_APP_ID}`;
  app.get('/setup', async (req, res) => {
    const { trigger_id } = req.session;

    req.log({ session: req.session, installation_id: req.params.installation_id }, 'Installed GitHub App');

    if (trigger_id) {
      delete req.session.trigger_id;
      req.log({ trigger_id }, 'Redirecting to resume pending command');
      res.redirect(`/slack/command?trigger_id=${trigger_id}`);
    } else {
      req.log({ trigger_id }, 'No pending command, redirecting to app');
      res.redirect(slackAppUrl);
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
