const { SubscriptionList } = require("../renderer/native");
import {NextFunction, Request, Response } from "express";

/**
 * Lists all subscriptions in a slack channel
 *
 * Usage:
 *   /github subscribe list
 */
module.exports = async (req: Request, res: Response, next: NextFunction) => {
  const { robot } = res.locals;
  const { Subscription, Installation } = robot.models;
  const command = req.body;
  if (command.text !== "list") {
    next();
    return;
  }

  const subscriptions = await Subscription.findAll({
    include: [Installation],
    where: { channelId: command.channel_id },
  });
  // @todo: Remove the below interface and use sequelize-typescript definitions instead
  interface ISubscription {
    githubId: number;
    Installation: {
      githubId: number;
    };
  }
  const repositories = await Promise.all(subscriptions.map(async (subscription: ISubscription) => {
    const github = await robot.auth(subscription.Installation.githubId);
    const repository = await github.repos.getById({ id: subscription.githubId });
    return repository.data;
  }));

  res.json(new SubscriptionList(repositories, command.channel_id));
};
