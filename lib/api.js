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

    // TODO: use provided credentials
    // const token = req.headers.authorization;

    // Look up repository
    const repository = (await github.repos.get({ owner, repo })).data;

    // TODO: verify token has access
    // This will work for user tokens
    // https://developer.github.com/v3/repos/collaborators/#check-if-a-user-is-a-collaborator

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
