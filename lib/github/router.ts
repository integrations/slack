import { createClient } from "../slack/client";
const { ReEnableSubscription } = require("../slack/renderer/flow");
import { userHasRepoAccess } from "./access";

// @todo: remove me and implement sequelize-typescript
interface ISubcription {
  githubId: number;
  creatorId: number;
  channelId: string;
  SlackWorkspace: {
    accessToken: string;
    slackId: string;
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

          if (!subscription.creatorId) {
            return callback(context, subscription, slack);
          }
          // Verify that subscription creator still has access to the resource
          const creator = await SlackUser.findById(subscription.creatorId, {
            include: [GitHubUser],
          });
          const userHasAccess = await userHasRepoAccess(
            context, subscription.githubId, creator.GitHubUser.accessToken,
          );
          if (!userHasAccess) {
            context.log.debug({
              subscription: {
                channelId: subscription.channelId,
                creatorId: subscription.creatorId,
                githubId: subscription.githubId,
                workspaceId: subscription.SlackWorkspace.slackId,
              },
            }, "User lost access to resource. Deleting subscription.");
            const channelId = subscription.channelId;
            await Promise.all([
              // @todo: deactive this subscription instead of deleting the db record
              await subscription.destroy(),
              await slack.chat.postMessage(
                subscription.channelId,
                "",
                (new ReEnableSubscription(context.payload.repository, creator.slackId)).toJSON(),
              ),
            ]);
            return;
          }
          return callback(context, subscription, slack);
        }));
      }
    };
  };
};
