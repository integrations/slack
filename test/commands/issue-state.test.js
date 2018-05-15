const nock = require('nock');
const { GitHubUser, SlackWorkspace } = require('../models');

const issueState = require('../../lib/commands/issue-state');
const fixtures = require('../fixtures');
const logger = require('probot/lib/logger');

describe('commands/change-state', () => {
  test('edits issue', async () => {
    const command = { respond: jest.fn() };

    const req = { log: logger };
    const res = {
      locals: {
        resource: { owner: 'foo', repo: 'bar', number: 123 },
        command,
        gitHubUser: new GitHubUser({ accessToken: 'test' }),
        slackWorkspace: new SlackWorkspace({ accessToken: 'test' }),
      },
    };

    nock('https://api.github.com')
      .patch('/repos/foo/bar/issues/123', (body) => {
        expect(body).toMatchObject({ state: 'closed' });
        return true;
      })
      .reply(200, fixtures.issue);

    nock('https://slack.com').post('/api/chat.postMessage').reply(200, { ok: true });

    await issueState('closed')(req, res);

    expect(res.locals.command.respond).toHaveBeenCalled();
  });
});
