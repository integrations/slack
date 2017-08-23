const bodyParser = require('body-parser');
const GitHubApi = require('github');

const WebClient = require('@slack/client').WebClient;

const token = process.env.OLD_MODEL_SLACK_TEST_TOKEN;
const web = new WebClient(token);

const {
  matchMetaDataStatetoIssueMessage,
  issueOpened,
  issueClosed,
  issueReopened,
} = require('./lib/issues');

const unfurl = require('./lib/unfurl');

// const { push } = require('./lib/push');

module.exports = (robot) => {
  robot.on('issues.opened', issueOpened);

  robot.on('issues.labeled', matchMetaDataStatetoIssueMessage);
  robot.on('issues.unlabeled', matchMetaDataStatetoIssueMessage);
  robot.on('issues.assigned', matchMetaDataStatetoIssueMessage);
  robot.on('issues.unassigned', matchMetaDataStatetoIssueMessage);
  robot.on('issue_comment', matchMetaDataStatetoIssueMessage);

  robot.on('issues.closed', issueClosed);

  robot.on('issues.reopened', issueReopened);

  // robot.on('push', push);

  const app = robot.route();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.post('/slack/', async (req, res) => {
    if (req.body.token === process.env.OLD_MODEL_SLACK_SECRET_TOKEN) {
      robot.log({body: req.body});
      const {type, challenge} = req.body;
      if (type === 'url_verification') {
        res.json({ challenge });
      } else if (req.body.event.type === 'link_shared') {
        robot.log('WTF?', req.body.event.links);
        const github = new GitHubApi();
        const link = req.body.event.links[0].url;
        const unfurls = {};
        unfurls[link] = await unfurl(github, link);
        web.chat.unfurl(
          req.body.event.message_ts,
          req.body.event.channel,
          unfurls
        );
      } else {
        console.log(type)
      }
    } else {
      res.status(401).json({ ok: false });
    }
  });
};
