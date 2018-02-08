import { NextFunction, Request, Response } from "express";
const GitHub = require("github");
import axios from "axios";

const { Subscribed, NotFound, AlreadySubscribed, NotSubscribed } = require("../renderer/flow");
const slack = require("../client");

interface Ilog {
  debug: (...args: any[]) => void;
  trace: (...args: any[]) => void;
}
/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe https://github.com/org/repo
 */
module.exports = async (req: Request & { log: Ilog }, res: Response) => {
  const { robot, resource, installation, gitHubUser, slackWorkspace, slackUser } = res.locals;
  const { Subscription, LegacySubscription } = robot.models;
  const command = req.body;

  req.log.debug({ installation, resource }, "Lookup respository to subscribe");

  const userAuthedGithub = new GitHub();
  userAuthedGithub.authenticate({
    token: gitHubUser.accessToken,
    type: "token",
  });

  const installationAuthedGitHub = await robot.auth(installation.githubId);

  // look up the resource
  let from;
  try {
    from = (await installationAuthedGitHub.repos.get(
      { owner: resource.owner, repo: resource.repo })
    ).data;
  } catch (e) {
    req.log.trace(e, "couldn't find repo");
  }
  const to = command.channel_id;

  if (!from) {
    return res.json(new NotFound(req.body.text));
  }

  if (command.subcommand === "subscribe") {
    if (await Subscription.lookupOne(from.id, to, slackWorkspace.id, installation.id)) {
      return res.json(new AlreadySubscribed(req.body.text));
    }

    // Hack to check if user can access the repository
    const userHasAccess = await userAuthedGithub.pullRequests.getAll(
      { owner: resource.owner, repo: resource.repo, per_page: 1 },
    ).then(() => true).catch(() => false);
    if (!userHasAccess) {
      return res.json(new NotFound(req.body.text));
    }

    const subscription = await Subscription.subscribe({
      channelId: to,
      creatorId: slackUser.id,
      githubId: from.id,
      installationId: installation.id,
      slackWorkspaceId: slackWorkspace.id,
    });

    res.json(new Subscribed({
      channelId: to,
      fromRepository: from,
    }));
    // check if there are any legacy configurations that we can disable
    const legacySubscriptions = await LegacySubscription.findAll({
      where: {
        channelSlackId: to,
        repoGitHubId: from.id,
        workspaceSlackId: slackWorkspace.slackId,
      },
    });
    return Promise.all(legacySubscriptions.map(async (legacySubscription: any) => {
      // call Slack API to disable subscription
      // eslint-disable-next-line no-underscore-dangle
      const payload = {
        payload: {
          action: "mark_subscribed",
          repo: {
            full_name: legacySubscription.repoFullName,
            id: legacySubscription.repoGitHubId,
          },
          service_type: "github",
        },
        service: legacySubscription.serviceSlackId,
      };
      req.log.debug("Removing legacy configuration", payload);

      const configurationRemovalRes = await axios.post("https://slack.com/api/services.update", payload, {
        headers: {
          "Authorization": `Bearer ${slackWorkspace.accessToken}`,
          "Content-Type": "application/json; charset=utf-8",
        },
      });
      if (configurationRemovalRes.data.ok) {
        req.log.debug("Removed legacy configuration", configurationRemovalRes.data);
      } else {
        req.log.debug("Failed to remove legacy configuration", configurationRemovalRes.data);
      }

      legacySubscription.reactivatedSubscriptionId = subscription.id;
      await legacySubscription.save();
    }));

  } else if (command.subcommand === "unsubscribe") {
    if (await Subscription.lookupOne(from.id, to, slackWorkspace.id, installation.id)) {
      await Subscription.unsubscribe(from.id, to, slackWorkspace.id);

      return res.json(new Subscribed({
        channelId: to,
        fromRepository: from,
        unsubscribed: true,
      }));
    }
    return res.json(new NotSubscribed(req.body.text));
  }
};
