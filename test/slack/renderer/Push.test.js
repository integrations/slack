const { Push } = require('../../../lib/slack/renderer/push');

const push = require('../../fixtures/webhooks/push.json');

describe('Push rendering', () => {
  test('works', async () => {
    const pushMessage = new Push({
      push,
    });
    const rendered = pushMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for 1 commit', async () => {
    const singleCommitPush = {
      ...push,
      commits: [push.commits[0]],
    };
    const pushMessage = new Push({
      push: singleCommitPush,
    });
    const rendered = pushMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works works for force-pushes', async () => {
    const forcePush = {
      ...push,
      forced: true,
    };
    const pushMessage = new Push({
      push: forcePush,
    });
    const rendered = pushMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
});
