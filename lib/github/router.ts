import { createClient } from "../slack/client";
const { ReEnableSubscription } = require("../slack/renderer/flow");
import { userHasRepoAccess } from "./helpers";

// @todo: remove me and implement sequelize-typescript
interface ISubcription {
  githubId: number;
  creatorId: number;
  channelId: string;
  SlackWorkspace: {
    accessToken: string;
  };
  destroy: () => void;
}

// Temporary "middleware" hack to look up routing before delivering event
module.exports = ({ models }: { models: any}) => {
  const { Subscription, SlackUser, GitHubUser } = models;

  return function route(callback: any) {
    return async (context: any) => {
      if (context.payload.repository) {
        const subscriptions = await Subscription.lookup(context.payload.repository.id);

        context.log.debug({ subscriptions }, "Delivering to subscribed channels");

        return Promise.all(subscriptions.map(async (subscription: ISubcription) => {
          // Create clack client with workspace token
          const slack = createClient(subscription.SlackWorkspace.accessToken);

          // Verify that subscription creator still has access to the resource
          if (subscription.creatorId) {
            const creator = await SlackUser.findById(subscription.creatorId, {
              include: [GitHubUser],
            });
            const [userHasAccess, repoName] = await userHasRepoAccess(
              subscription.githubId, creator.GitHubUser.accessToken,
            );
            if (!userHasAccess) {
              await slack.chat.postMessage(
                subscription.channelId,
                "",
                (new ReEnableSubscription(repoName, creator.slackId)).toJSON(),
              );
              // @todo: deactive this subscription instead of deleting the db record
              await subscription.destroy();
            }
          }

          return callback(context, subscription, slack);
        }));
      }
    };
  };
};
