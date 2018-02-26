const { InstallGitHubApp } = require('../../../lib/messages/flow');

describe('InstallGitHubApp message rendering', () => {
  test('works without a note', async () => {
    const message = new InstallGitHubApp({
      installLink: 'https://github.com/apps/url-to-slack-app',
    });
    expect(message.toJSON()).toMatchSnapshot();
  });
  test('works with if owner is user ', async () => {
    const message = new InstallGitHubApp({
      installLink: 'https://github.com/apps/url-to-slack-app',
      ownerType: 'User',
    });
    expect(message.toJSON()).toMatchSnapshot();
  });
  test('works if owner is organization', async () => {
    const message = new InstallGitHubApp({
      installLink: 'https://github.com/apps/url-to-slack-app',
      ownerType: 'organization',
    });
    expect(message.toJSON()).toMatchSnapshot();
  });
});
