import GitHub from "github";

export async function userHasRepoAccess(repoId: number, accessToken: string): Promise<[boolean, string | undefined]> {
  const github = new GitHub();
  github.authenticate({
    token: accessToken,
    type: "token",
  });
  let repo;
  try {
    const response = await github.repos.getById({ id: repoId.toString() });
    repo = response.data;
  } catch (e) {
    return [false, undefined];
  }
  return [true, repo.full_name];
}
