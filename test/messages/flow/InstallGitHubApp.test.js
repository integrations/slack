const { InstallGitHubApp } = require('../../../lib/messages/flow');

describe('InstallGitHubApp message rendering', () => {
  test('works without a note', async () => {
    const message = new InstallGitHubApp({
      installLink: 'https://github.com/apps/url-to-slack-app',
      owner: {
        id: 5,
      },
      gitHubUser: {
        id: '5',
      },
    });
    expect(message.toJSON()).toMatchSnapshot();
  });
  test('works with if owner is user ', async () => {
    const message = new InstallGitHubApp({
      installLink: 'https://github.com/apps/url-to-slack-app',
      owner: {
        id: 3,
        type: 'User',
      },
      gitHubUser: {
        id: '5',
      },
    });
    expect(message.toJSON()).toMatchSnapshot();
  });
  test('works if owner is organization', async () => {
    const message = new InstallGitHubApp({
      installLink: 'https://github.com/apps/url-to-slack-app',
      owner: {
        id: 3,
        type: 'Organization',
      },
      gitHubUser: {
        id: '5',
      },
    });
    expect(message.toJSON()).toMatchSnapshot();
  });
});
