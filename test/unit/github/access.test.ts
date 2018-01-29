import nock from "nock";
import { userHasRepoAccess } from "../../../lib/github/access";

describe("userHasRepoAccess", () => {
  test("returns true for user with access", async () => {
    nock("https://api.github.com").get("/repositories/1").reply(200);
    const hasAccess = await userHasRepoAccess(1, "secret");
    expect(hasAccess).toBe(true);
  });
  test("returns false for user without", async () => {
    nock("https://api.github.com").get("/repositories/1").reply(404);
    const hasAccess = await userHasRepoAccess(1, "secret");
    expect(hasAccess).toBe(false);
  });
});
