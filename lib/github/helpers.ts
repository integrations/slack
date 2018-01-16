import axios from "axios";

export async function userHasRepoAccess(repoId: number, accessToken: string): Promise<[boolean, string]> {
  const response = await axios.post(`https://api.github.com/repositories/${repoId}`, {
    Authorizaion: `token ${accessToken}`,
  });
  return [response.status === 200, response.data.full_name];
}
