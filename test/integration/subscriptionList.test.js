const request = require('supertest');
const nock = require('nock');

const helper = require('.');
const fixtures = require('../fixtures');

const { probot } = helper;
// create a bunch of subscriptions in database
// receive slash command for subscription list
// nock assertions

describe('Integration: subscription list', async () => {
  const { SlackWorkspace, Installation, Subscription } = helper.robot.models;

  const workspace = await SlackWorkspace.create({
    slackId: 1,
    accessToken: 'secret',
  });

  const installation = await Installation.create({
    githubId: 1,
    ownerId: 1,
  });

  await Subscription.create({
    githubId: 1,
    channelId: 'C2147483705',
    installationId: installation.id,
    slackWorkspaceId: workspace.id,
  });

  await Subscription.create({
    githubId: 2,
    channelId: 'C2147483705',
    installationId: installation.id,
    slackWorkspaceId: workspace.id,
  });

  test('works', async () => {
    const command = fixtures.slack.command({
      text: 'subscribe list',
    });

    await request(probot.server).post('/slack/command').send(command)
     .expect(200)
     .expect((res) => {
       expect(res.body).toMatchSnapshot();
     });
  });
});
