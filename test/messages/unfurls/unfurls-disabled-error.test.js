const UnfurlsDisabledError = require('../../../lib/messages/unfurls/unfurls-disabled-error');

describe('UnfurlsDisabledError message rendering', () => {
  test('works', async () => {
    const message = new UnfurlsDisabledError();
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
