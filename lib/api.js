const bodyParser = require('body-parser');
const { GitHubAPI, ProbotOctokit } = require('./github/client');
const githubUrl = require('./github-url');

const { Subscription } = require('./models');

module.exports = (robot) => {
  const app = robot.route('/repos');

  // Treat all request bodies as JSON
  app.use(bodyParser.json({ type: '*/*' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post('/:owner/:repo', async (req, res) => {
    // Ensure credentials were provided
    if (!req.headers.authorization) {
      return res.status(401).send({ message: 'Requires authentication' });
    }

    const github = GitHubAPI({
      baseUrl: githubUrl.baseRoutes().apiUrl,
      Octokit: ProbotOctokit,
      logger: req.log,
      retry: {
        // disable retries to test error states
        enabled: false,
      },
      throttle: {
        // disabled to test upgrade behavior without Bottleneck
        enabled: false,
      },
      headers: {
        // Use provided credentials to make requests to the GitHub API
        authorization: req.headers.authorization,
      },
    });

    // Look up repository
    const repository = (await github.repos.get(req.params)).data;

    // Ensure token has write access
    // TODO: figure out how to make this work for GitHub App tokens
    if (!repository.permissions || !repository.permissions.push) {
      res.status(404).send({ message: 'Not found' });
      return;
    }

    // Lookup subscriptions for repository
    const subscriptions = await Subscription.lookup(repository.id);

    const attachments = [].concat(req.body);

    // Deliver message to each channel
    await Promise.all(subscriptions.map(async (subscription) => {
      const slack = subscription.SlackWorkspace.client;

      const params = {
        channel: subscription.channelId,
        attachments,
      };

      req.log(params, 'Delivering message to subscription');
      await slack.chat.postMessage(params);
    }));

    res.send({ ok: true });
  });
};
