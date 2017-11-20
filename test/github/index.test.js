process.env.SLACK_VERIFICATION_TOKEN = 'shutup';

const createProbot = require('probot');

const app = require('../../lib/github');

const installationCreated = require('../fixtures/webhooks/installation.created.json');
const installationDeleted = require('../fixtures/webhooks/installation.deleted.json');

describe('github', () => {
  describe('installations', () => {
    test('installation created records', async () => {
      const probot = createProbot({});
      const robot = probot.load(app)

      console.log("WTF?", robot.models);

      await probot.receive({
        event: 'installation',
        payload: installationCreated,
      });

      // expect that records exists
      const installation = await robot.models.Installation.findOne({where: {
        githubId: installationCreated.installation.id
      }});
      expect(installation).toBeTruthy();
    });
  });
});
