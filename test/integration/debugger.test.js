const { models } = require('.');

const { GitHubUser } = models;

describe('Debugger', () => {
  test('should re-throw errors', async () => {
    await expect(GitHubUser.findOrCreate({ where: { nonExistingColumn: 'anything' } })).rejects.toMatchSnapshot();
  });
});
