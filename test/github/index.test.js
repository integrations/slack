process.env.SLACK_VERIFICATION_TOKEN = 'shutup';

const createProbot = require('probot');
const GitHub = require('github');

const app = require('../../lib/github');

const installationCreated = require('../fixtures/webhooks/installation.created.json');
// const installationDeleted = require('../fixtures/webhooks/installation.deleted.json');

describe('github', () => {
  describe('installations', () => {
    test('installation created records', async () => {
      const probot = createProbot({
        cert: process.env.PRIVATE_KEY,
      });
      const robot = probot.load(app);
      robot.auth = jest.fn().mockReturnValue(Promise.resolve(new GitHub()));

      await probot.receive({
        event: 'installation',
        payload: installationCreated,
      });

      // expect that records exists
      const installation = await robot.models.Installation.findOne({
        where: { githubId: installationCreated.installation.id } });

      expect(installation).toBeTruthy();
    });
  });
});
