import nock from "nock";
import { userHasRepoAccess } from "../../../lib/github/helpers";

describe("userHasRepoAccess", () => {
  test("returns true for user with access", async () => {
    nock("https://api.github.com").get("/repositories/1").reply(200, {
      full_name: "atom/atom",
    });
    const [hasAccess, repoName] = await userHasRepoAccess(1, "secret");
    expect(hasAccess).toBe(true);
    expect(repoName).toBeDefined();
  });
  test("returns false for user without", async () => {
    nock("https://api.github.com").get("/repositories/1").reply(404);
    const [hasAccess, repoName] = await userHasRepoAccess(1, "secret");
    expect(hasAccess).toBe(false);
    expect(repoName).toBeUndefined();
  });
});
