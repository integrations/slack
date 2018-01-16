const GitHub = require("github");

export async function userHasRepoAccess(repoId: number, accessToken: string): Promise<boolean> {
  const github = new GitHub();
  github.authenticate({
    token: accessToken,
    type: "token",
  });
  try {
    const response = await github.repos.getById({ id: repoId.toString() });
  } catch (e) {
    return false;
  }
  return true;
}
