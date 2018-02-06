import nock from "nock";
const logger = require("probot/lib/logger");
import { userHasRepoAccess } from "../../../lib/github/access";

describe("userHasRepoAccess", () => {
  test("returns true for user with access", async () => {
    nock("https://api.github.com").get("/repositories/1").reply(200);
    const hasAccess = await userHasRepoAccess(logger, 1, "secret");
    expect(hasAccess).toBe(true);
  });
  test("returns true for unexpected status codes", async () => {
    nock("https://api.github.com").get("/repositories/1").reply(500);
    const hasAccess = await userHasRepoAccess(logger, 1, "secret");
    expect(hasAccess).toBe(false);
  });
  test("returns false for user without access", async () => {
    nock("https://api.github.com").get("/repositories/1").reply(404);
    const hasAccess = await userHasRepoAccess(logger, 1, "secret");
    expect(hasAccess).toBe(false);
  });
});
