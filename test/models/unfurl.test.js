const { Unfurl, SlackWorkspace } = require('.');

describe('models.Unfurl', () => {
  test('log creates row in unfurls table', async () => {
    const workspace = await SlackWorkspace.create({
      slackId: 'T001',
      accessToken: 'test',
    });
    await Unfurl.log(
      workspace.id,
      'U01234',
      'C01234',
      'pull',
      'https://github.com/atom/atom/pull/1',
      false,
      true,
    );
    expect(await Unfurl.count()).toBe(1);
  });
});
