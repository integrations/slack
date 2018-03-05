const installations = require('./installations');

const oauth = require('./oauth');
const activity = require('../activity');

const SignedParams = require('../signed-params');

module.exports = (robot) => {
  // Track installations
  installations(robot);

  // set up GitHub oauth
  oauth(robot);

  activity(robot);

  const app = robot.route('/github');

  app.get('/install/:id/:state', async (req, res) => {
    const { trigger_id } = await SignedParams.load(req.params.state);
    req.session.trigger_id = trigger_id;
    const info = await robot.info();

    req.log({ trigger_id, owner_id: req.params.id }, 'Redirecting to install GitHub APP');
    res.redirect(`${info.html_url}/installations/new`);
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
};
