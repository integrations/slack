const GitHub = require("github");

export async function userHasRepoAccess(repoId: number, accessToken: string): Promise<boolean> {
  const github = new GitHub();
  github.authenticate({
    token: accessToken,
    type: "token",
  });
  return github.repos.getById({ id: repoId.toString() }).then(() => true).catch(() => false);
}
