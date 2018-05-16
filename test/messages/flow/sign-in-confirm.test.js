const SignInConfirm = require('../../../lib/messages/flow/sign-in-confirm');

describe('SignInConfirm rendering', () => {
  test('works', async () => {
    const message = new SignInConfirm('U12345', 'https://github.com/tarebyte', 'tarebyte');
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
