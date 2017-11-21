const router = require('../router');

const {
  matchMetaDataStatetoIssueMessage,
  issueEvent,
} = require('./notifications/issues');


const {
  pullRequestEvent,
  onStatus,
  storePRMapping,
} = require('./notifications/pullRequests');

const {
  deploymentStatus,
} = require('./notifications/deployments');

const {
  push,
} = require('./notifications/push');

const models = require('../db/models');

module.exports = (robot) => {
  // eslint-disable-next-line no-param-reassign
  robot.models = models(robot);

  // Temporary "middleware" hack to look up routing before delivering event
  function route(callback) {
    return async (context) => {
      // FIXME: we should be able to route all messages, even if there isn't a repo
      if (context.payload.repository) {
        const channels = await router.lookup(context.payload.repository.url);
        robot.log.trace({ channels }, 'Delivering to subscribed channels');

        return Promise.all(channels.map((channel) => {
          // TODO: we'll fix this later
          // eslint-disable-next-line no-param-reassign
          context.channel = channel;
          return callback(context);
        }));
      }
    };
  }

  robot.on(['issues.opened', 'issues.closed', 'issues.reopened'], route(issueEvent));

  robot.on([
    'issues.labeled',
    'issues.unlabeled',
    'issues.assigned',
    'issues.unassigned',
    'issue_comment',
  ], matchMetaDataStatetoIssueMessage);

  robot.on(['pull_request.opened', 'pull_request.closed', 'pull_request.reopened'], pullRequestEvent);
  robot.on(['pull_request.opened', 'pull_request.synchronize'], storePRMapping);
  robot.on('status', onStatus);
  robot.on('deployment_status', deploymentStatus);
  robot.on('push', push);

  robot.on('installation.created', async (context) => {
    const { Installation } = robot.models;

    await Installation
      .findOrCreate({
        where: { ownerId: context.payload.installation.account.id },
        defaults: { githubId: context.payload.installation.id },
      })
      .spread((installation, created) => {
        robot.log(installation.get({ plain: true }));
        robot.log(created);
      });
  });

  robot.on('installation.deleted', async (context) => {
    console.log('OHAI?');
    const { Installation } = robot.models;

    await Installation
      .destroy({
        where: { ownerId: context.payload.installation.account.id },
      });
  });
};
