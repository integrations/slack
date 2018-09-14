const request = require('supertest');
const nock = require('nock');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const {
  SlackUser,
  GitHubUser,
  Installation,
} = models;

describe('Integration: Creating issues from Slack', () => {
  let workspace;
  let githubUser;
  beforeEach(async () => {
    const { SlackWorkspace } = models;
    workspace = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxa-token',
    });

    githubUser = await GitHubUser.create({
      id: 1,
      accessToken: 'secret',
    });

    await SlackUser.create({
      slackId: 'U2147483697', // same as in fixtures.slack.command
      slackWorkspaceId: workspace.id,
      githubId: githubUser.id,
    });

    await Installation.create({
      githubId: 1,
      ownerId: 1337,
    });
  });
  test.only('works when specifying a repository', async () => {
    nock('https://api.github.com').get('/repos/kubernetes/kubernetes/installation').reply(200, {
      id: 1337,
      account: {
        id: 1,
      },
    });


    nock('https://api.github.com').get('/repos/kubernetes/kubernetes').reply(200, {
      full_name: 'kubernetes/kubernetes',
      id: 54321,
    });

    nock('https://api.github.com').get('/repos/kubernetes/kubernetes/labels').reply(200, [{
      id: 1234,
      name: 'test',
      color: '000000',
    }]);

    nock('https://api.github.com').get('/repos/kubernetes/kubernetes/contents/.github/ISSUE_TEMPLATE').reply(404, {});

    nock('https://slack.com').post('/api/dialog.open', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    const command = fixtures.slack.command({
      text: 'open kubernetes/kubernetes',
    });

    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });

    nock('https://api.github.com').get('/repositories/54321').reply(200, {
      name: 'kubernetes',
      owner: {
        login: 'kubernetes',
      },
    });

    nock('https://api.github.com').post('/repos/kubernetes/kubernetes/issues').reply(200);

    // User submits dialog to open issue
    await request(probot.server).post('/slack/actions').send({
      payload: JSON.stringify(fixtures.slack.action.dialogSubmissionSingleRepo()),
    })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });

  test('works when specifying a repository with a bad labels response', async () => {
    nock('https://api.github.com').get('/repos/kubernetes/kubernetes/installation').reply(200, {
      id: 1337,
      account: {
        id: 1,
      },
    });

    nock('https://api.github.com').get('/repos/kubernetes/kubernetes').reply(200, {
      full_name: 'kubernetes/kubernetes',
      id: 54321,
    });

    nock('https://api.github.com').get('/repos/kubernetes/kubernetes/labels').reply(200, {});

    nock('https://slack.com').post('/api/dialog.open', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    const command = fixtures.slack.command({
      text: 'open kubernetes/kubernetes',
    });

    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });

    nock('https://api.github.com').get('/repositories/54321').reply(200, {
      name: 'kubernetes',
      owner: {
        login: 'kubernetes',
      },
    });

    nock('https://api.github.com').post('/repos/kubernetes/kubernetes/issues').reply(200);

    // User submits dialog to open issue
    await request(probot.server).post('/slack/actions').send({
      payload: JSON.stringify(fixtures.slack.action.dialogSubmissionSingleRepo()),
    })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });

  test('works when specifying a repository with an empty labels list', async () => {
    nock('https://api.github.com').get('/repos/kubernetes/kubernetes/installation').reply(200, {
      id: 1337,
      account: {
        id: 1,
      },
    });

    nock('https://api.github.com').get('/repos/kubernetes/kubernetes').reply(200, {
      full_name: 'kubernetes/kubernetes',
      id: 54321,
    });

    nock('https://api.github.com').get('/repos/kubernetes/kubernetes/labels').reply(200, []);

    nock('https://slack.com').post('/api/dialog.open', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    const command = fixtures.slack.command({
      text: 'open kubernetes/kubernetes',
    });

    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });

    nock('https://api.github.com').get('/repositories/54321').reply(200, {
      name: 'kubernetes',
      owner: {
        login: 'kubernetes',
      },
    });

    nock('https://api.github.com').post('/repos/kubernetes/kubernetes/issues').reply(200);

    // User submits dialog to open issue
    await request(probot.server).post('/slack/actions').send({
      payload: JSON.stringify(fixtures.slack.action.dialogSubmissionSingleRepo()),
    })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });
});

describe('Integration: Slack actions', () => {
  let workspace;
  let githubUser;
  beforeEach(async () => {
    const { SlackWorkspace } = models;
    workspace = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxa-token',
    });
    githubUser = await GitHubUser.create({
      id: 1,
      accessToken: 'secret',
    });

    await SlackUser.create({
      slackId: 'U2147483697', // same as in link_shared.js
      slackWorkspaceId: workspace.id,
      githubId: githubUser.id,
    });
  });
  describe('Attaching a Slack message to an issue/pr thread', async () => {
    test('when a user has not yet connected their GitHub account they are prompted to do so first', async () => {
      let prompt;
      nock('https://hooks.slack.com').post('/actions/1234/5678', (body) => {
        prompt = body;
        return true;
      }).reply(200);

      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify({
          ...fixtures.slack.action.commentAction(),
          user: {
            id: 'UOther',
          },
        }),
      }).expect(200);

      const promptUrl = /^http:\/\/127\.0\.0\.1:\d+(\/github\/oauth\/login\?state=(.*))/;
      const { attachments } = prompt;
      const { text, url } = attachments[0].actions[0];
      expect(text).toMatch('Connect GitHub account');
      expect(url).toMatch(promptUrl);
    });

    test('User can select issue, comment by submitting the dialog, and view a confirmation message', async () => {
      nock('https://slack.com').post('/api/dialog.open', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      // User triggers action on message
      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify(fixtures.slack.action.commentAction()),
      }).expect(200);

      nock('https://api.github.com').post('/graphql', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, fixtures.create.graphqlIssuesPrs);
      // Initial option load
      await request(probot.server).post('/slack/options').send({
        payload: JSON.stringify(fixtures.slack.options.loadIssuesAndPrs()),
      })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });

      nock('https://api.github.com').post('/graphql', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, fixtures.create.graphqlIssuesPrs);
      // User types query and additional options load
      await request(probot.server).post('/slack/options').send({
        payload: JSON.stringify(fixtures.slack.options.loadIssuesAndPrs('hello')),
      })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });

      nock('https://api.github.com').get('/repos/kubernetes/kubernetes/installation').reply(200, {
        permissions: {
          issues: 'write',
          pull_requests: 'write',
        },
      });

      nock('https://api.github.com').post('/repos/kubernetes/kubernetes/issues/1/comments').reply(200, {
        html_url: 'https://github.com/integrations/test/issues/58#issuecomment-392920929',
      });

      nock('https://hooks.slack.com').post('/actions/1234/5678', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200);
      // User submits dialog using search select:
      // Comment is created on GitHub, and user sees confirmation message
      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify(fixtures.slack.action.addComment()),
      })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    test('User can input a URL, comment by submitting the dialog, and view a confirmation message', async () => {
      nock('https://slack.com').post('/api/dialog.open', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, { ok: true });

      // User triggers action on message
      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify(fixtures.slack.action.commentAction()),
      }).expect(200);

      nock('https://api.github.com').post('/graphql', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200, fixtures.create.graphqlIssuesPrs);
      // Initial option load even when URL input is used
      await request(probot.server).post('/slack/options').send({
        payload: JSON.stringify(fixtures.slack.options.loadIssuesAndPrs()),
      })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });

      nock('https://api.github.com').get('/repos/atom/atom/installation').reply(200, {
        permissions: {
          issues: 'write',
          pull_requests: 'write',
        },
      });

      nock('https://api.github.com').post('/repos/atom/atom/issues/1/comments').reply(200, {
        html_url: 'https://github.com/integrations/test/issues/58#issuecomment-392920929',
      });

      nock('https://hooks.slack.com').post('/actions/1234/5678', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200);
      // User submits dialog using URL input:
      // Comment is created on GitHub, and user sees confirmation message
      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify(fixtures.slack.action.addCommentManualUrl('https://github.com/atom/atom/issues/1')),
      })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    test('User sees error when either URL is missing or no issue was selected', async () => {
      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify(fixtures.slack.action.addCommentNothingSelected()),
      })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    test('User sees error when submitting an invalid URL', async () => {
      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify(fixtures.slack.action.addCommentManualUrl('https://github.com/atom/atom')),
      })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    test('User sees error when submitting a valid URL but for an issue that doesn\'t exist', async () => {
      nock('https://api.github.com').get('/repos/atom/atom/installation').reply(200, {
        permissions: {
          issues: 'write',
          pull_requests: 'write',
        },
      });

      nock('https://api.github.com').post('/repos/atom/atom/issues/4321/comments').reply(404);

      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify(fixtures.slack.action.addCommentManualUrl('https://github.com/atom/atom/issues/4321')),
      })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    test('error is shown in dialog when installation for URL does not exist', async () => {
      nock('https://api.github.com').get('/repos/atom/atom/installation').reply(404);

      nock('https://api.github.com').get('/app').optionally().reply(200, {
        html_url: 'https://github.com/url/to/app',
      });

      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify(fixtures.slack.action.addCommentManualUrl('https://github.com/atom/atom/issues/1')),
      })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });

    test('error is shown in dialog when installation for URL does not have all required permissions', async () => {
      nock('https://api.github.com').get('/repos/atom/atom/installation').reply(200, {
        permissions: {
          issues: 'read',
          pull_requests: 'read',
        },
      });

      nock('https://api.github.com').get('/app').optionally().reply(200, {
        html_url: 'https://github.com/url/to/app',
      });

      await request(probot.server).post('/slack/actions').send({
        payload: JSON.stringify(fixtures.slack.action.addCommentManualUrl('https://github.com/atom/atom/issues/1')),
      })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchSnapshot();
        });
    });
  });
});
