const { Subscription, Installation } = require('../models');
const SubscriptionList = require('../messages/subscription-list');
const { Help } = require('../messages/flow');

/**
 * Lists all subscriptions in a slack channel
 *
 * Usage:
 *   /github subscribe list
 */
module.exports = (robot) => {
  return {
    name: 'subscribe list',
    matches(command) {
      return command.name === 'subscribe' && [undefined, 'list'].includes(command.args[0]);
    },
    async action(command) {
      const subscriptions = await Subscription.findAll({
        include: [Installation],
        where: { channelId: command.channel_id },
      });

      let repositories = await Promise.all(subscriptions.map(async (subscription) => {
        const github = await robot.auth(subscription.Installation.githubId);
        try {
          const repository = await github.repos.getById({ id: subscription.githubId });
          return repository.data;
        } catch (err) {
          command.log.error({ err, repoId: subscription.githubId }, 'Could not find repository for subscription');
          if (err.code !== 404) {
            throw err;
          }
        }
      }));

      // remove undefined
      repositories = repositories.filter(repo => repo);

      if (command.args[0] === 'list') {
        await command.respond(new SubscriptionList(repositories, command.context.channel_id));
        return;
      }

      const response = (new Help(command.namespace, command.name)).toJSON();
      const list = new SubscriptionList(repositories, command.context.channel_id);
      response.attachments.push(list.toJSON().attachments[0]);
      await command.respond(response);
    },
  };
};
