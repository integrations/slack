const { SignIn } = require('../../../lib/messages/flow');

describe('SignIn rendering', () => {
  test('works', async () => {
    const message = new SignIn('https://example.org/github/oauth/login?state=abcdef');
    expect(message.toJSON()).toMatchSnapshot();
  });
});
