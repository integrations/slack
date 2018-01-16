import { ReEnableSubscription } from "../../../../lib/slack/renderer/flow";

describe("ReEnableSubscription message rendering", () => {
  test("works", () => {
    const message = new ReEnableSubscription("atom/atom", "U012345");
    expect(message.toJSON()).toMatchSnapshot();
  });
});
