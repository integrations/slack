const { InstallGitHubApp } = require('../../../lib/messages/flow');

describe('InstallGitHubApp message rendering', () => {
  test('works', async () => {
    const message = new InstallGitHubApp('https://github.com/apps/url-to-slack-app');
    expect(message.toJSON()).toMatchSnapshot();
  });
});
