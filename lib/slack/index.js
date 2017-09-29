const bodyParser = require('body-parser');
const GitHubApi = require('github');

const slack = require('./client');
const unfurl = require('./unfurl');

const github = new GitHubApi();

module.exports = (robot) => {
  const router = robot.route('/slack');
  const logger = robot.log;

  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));

  // Mount the event handler on a route
  router.use('/events', slack.events.expressMiddleware());

  // Handle errors (see `errorCodes` export)
  slack.events.on('error', logger.error);

  // Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
  slack.events.on('link_shared', (event) => {
    logger.debug({ slack: event }, 'Slack event received');

    const unfurls = {};
    event.links.forEach(async (link) => {
      unfurls[link.url] = await unfurl(github, link.url);
      logger.trace(unfurls, 'Unfurling links');
      slack.web.chat.unfurl(
        event.message_ts,
        event.channel,
        unfurls,
        (err, slackRes) => {
          if (err) {
            logger.error(err);
          } else {
            logger.trace(slackRes, 'Unfurl complete');
          }
        },
      );
    });
  });

  router.post('/commands', async (req, res) => {
    // extract the verification token, slash command text,
    // and trigger ID from payload
    const { token, text, trigger_id } = req.body;

    if (token === process.env.SLACK_VERIFICATION_TOKEN && text.includes('issue')) {
      // implement the below line so that it fetches the labels
      // from the repo linked to the channel from where the slash command was executed
      const labels = [
        {
            "id": 669548423,
            "url": "https://api.github.com/repos/github-slack/app/labels/bug",
            "name": "bug",
            "color": "ee0701",
            "default": true
        },
        {
            "id": 669548424,
            "url": "https://api.github.com/repos/github-slack/app/labels/duplicate",
            "name": "duplicate",
            "color": "cccccc",
            "default": true
        },
        {
            "id": 669548425,
            "url": "https://api.github.com/repos/github-slack/app/labels/enhancement",
            "name": "enhancement",
            "color": "84b6eb",
            "default": true
        },
        {
            "id": 669548426,
            "url": "https://api.github.com/repos/github-slack/app/labels/help%20wanted",
            "name": "help wanted",
            "color": "128A0C",
            "default": true
        },
        {
            "id": 669548427,
            "url": "https://api.github.com/repos/github-slack/app/labels/invalid",
            "name": "invalid",
            "color": "e6e6e6",
            "default": true
        },
        {
            "id": 669548428,
            "url": "https://api.github.com/repos/github-slack/app/labels/question",
            "name": "question",
            "color": "cc317c",
            "default": true
        },
        {
            "id": 696918185,
            "url": "https://api.github.com/repos/github-slack/app/labels/Slack",
            "name": "Slack",
            "color": "E31472",
            "default": false
        },
        {
            "id": 669548429,
            "url": "https://api.github.com/repos/github-slack/app/labels/wontfix",
            "name": "wontfix",
            "color": "ffffff",
            "default": true
        }
    ]
      const dialog = JSON.stringify({
        callback_id: 'open-issue',
        title: 'Open issue',
        submit_label: 'Open',
        elements: [
          {
            type: 'text',
            label: 'Title',
            name: 'title',
          },
          {
            type: 'textarea',
            label: 'Write',
            name: 'body',
            optional: true,
            placeholder: 'Leave a comment',
            hint: 'GitHub markdown syntax is supported, although you cannot preview it in Slack.',
          },
          {
            label: 'Label',
            type: 'select',
            name: 'label',
            placeholder: 'Select a label',
            options: labels.map(inputLabel => (
              {
                label: inputLabel.name,
                value: inputLabel.name,
              }
            )),
          },
        ],
      });
      slack.web.dialog.open(dialog, trigger_id, (err, slackRes) => {
        if (err) {
          robot.log.error(err);
        } else {
          robot.log.trace(slackRes, 'Dialog opened');
        }
      });
      res.status(200).send();
    }
  });

  router.post('/interactive', async (req, res) => {
    const payload = JSON.parse(req.body.payload);

    if (payload.token === process.env.SLACK_VERIFICATION_TOKEN && payload.user.name === 'wilhelmklopp') {
      const { title, body, label } = payload.submission;
      github.authenticate({
        type: 'token',
        token: process.env.GITHUB_WILHELM_PERSONAL_ACCESS_TOKEN,
      });
      github.issues.create({
        owner: 'github-slack',
        repo: 'test',
        title,
        body,
        labels: [label],
      });
      res.status(200).send();
    }
  });
};
