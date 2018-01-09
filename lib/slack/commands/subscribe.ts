import { NextFunction, Request, Response } from "express";
const GitHub = require("github");

const { Subscribed, NotFound, AlreadySubscribed, NotSubscribed } = require("../renderer/flow");

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
  const { robot, resource, installation, gitHubUser, slackWorkspace } = res.locals;
  const { Subscription } = robot.models;
  const command = req.body;

  req.log.debug({ installation, resource }, "Lookup respository to subscribe");

  // TODO: Steps here to verify this user has access
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

    await Subscription.subscribe(from.id, to, slackWorkspace.id, installation.id);

    return res.json(new Subscribed({
      channelId: to,
      fromRepository: from,
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
