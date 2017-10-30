const { Repository } = require('./../../lib/slack/renderer/Repository');
const repoFixture = require('./../fixtures/repo.json');

describe('Repository rendering', () => {
  test('works', async () => {
    const repositoryMessage = new Repository({
      repository: repoFixture,
    });
    expect(repositoryMessage.getRenderedMessage()).toMatchSnapshot();
  });
});
