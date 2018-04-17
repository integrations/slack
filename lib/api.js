const bodyParser = require('body-parser');
const GitHub = require('probot/lib/github');

const { Subscription } = require('./models');

module.exports = (robot) => {
  const app = robot.route('/repos');

  app.use(bodyParser.json({ type: '*/*' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post('/:owner/:repo', async (req, res) => {
    const { owner, repo } = req.params;
    const github = new GitHub({ logger: req.log });

    // Ensure credentials were provided
    if (!req.headers.authorization) {
      res.status(401).send({ message: 'Requires authentication' });
      return;
    }

    // Use provided credentials to make requests to the GitHub API
    github.hook.before('request', (options) => {
      // eslint-disable-next-line no-param-reassign
      options.headers.authorization = req.headers.authorization;
    });

    // Look up repository
    const repository = (await github.repos.get({ owner, repo })).data;

    // Ensure token has write access
    // TODO: figure out how to make this work for GitHub App tokens
    if (!repository.permissions || !repository.permissions.push) {
      res.status(404).send({ message: 'Not found' });
      return;
    }

    // Lookup subscriptions for repository
    const subscriptions = await Subscription.lookup(repository.id);

    // Deliver message to each channel
    await Promise.all(subscriptions.map(async (subscription) => {
      const slack = subscription.SlackWorkspace.client;

      const params = {
        channel: subscription.channelId,
        ...req.body,
      };

      req.log(params, 'Delivering message to subscription');
      await slack.chat.postMessage(params);
    }));

    res.send({ ok: true });
  });
};
