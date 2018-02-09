const GitHub = require("github");

export async function userHasRepoAccess(logger: any, repoId: number, accessToken: string): Promise<boolean> {
  const github = new GitHub();
  github.authenticate({
    token: accessToken,
    type: "token",
  });
  return github.repos.getById({ id: repoId.toString() })
  .then(() => true)
  .catch((err: any) => {
    if (err.code !== 404) {
      // If GitHub API temporarily fails or otherwise misbehaves, we should not disable the subscription
      logger.warn({err, repoId}, "Unexpected status code while executing userHasRepoAccess");
      return true;
    }
    return false;
  });
}
