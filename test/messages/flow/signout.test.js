const { SignOut } = require('../../../lib/messages/flow');

describe('SignOut rendering', () => {
  test('works', async () => {
    const message = new SignOut('https://example.org/github/oauth/login?state=abcdef', 'U012345');
    expect(message.toJSON()).toMatchSnapshot();
  });
});
