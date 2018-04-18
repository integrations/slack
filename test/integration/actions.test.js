const request = require('supertest');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

describe('Actions', async () => {
  beforeEach(async () => {
    const { SlackWorkspace, SlackUser } = models;
    const workspace = await SlackWorkspace.create({
      slackId: 'T000A',
      accessToken: 'xoxa-token',
    });
    await SlackUser.create({
      slackId: 'U88HS',
      slackWorkspaceId: workspace.id,
    });
  });
  test('When an action\'s name is "cancel", then it is immediately deleted', async () => {
    await request(probot.server).post('/slack/actions').send({
      payload: JSON.stringify(fixtures.slack.action.cancel()),
    })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });
});
