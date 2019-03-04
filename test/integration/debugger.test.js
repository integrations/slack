const { probot, models } = require('.');

const { GitHubUser } = models;

describe('Debugger', () => {
  test('should re-throw errors', async () => {
    probot.logger.level('fatal');
    await expect(GitHubUser.findOrCreate({ where: { nonExistingColumn: 'anything' } })).rejects.toMatchSnapshot();
  });
});
