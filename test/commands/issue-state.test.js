const nock = require('nock');
const { GitHubUser } = require('../models');

const issueState = require('../../lib/commands/issue-state');

describe('commands/change-state', () => {
  test('edits issue', async () => {
    const command = { respond: jest.fn() };

    const req = {};
    const res = {
      locals: {
        resource: { owner: 'foo', repo: 'bar', number: 123 },
        command,
        gitHubUser: new GitHubUser({ accessToken: 'test' }),
      },
    };

    nock('https://api.github.com')
      .patch('/repos/foo/bar/issues/123', (body) => {
        expect(body).toMatchObject({ state: 'closed' });
        return true;
      })
      .reply(200);

    await issueState('closed', req, res);

    expect(res.locals.command.respond).toHaveBeenCalled();
  });
});
