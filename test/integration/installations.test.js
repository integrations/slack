const setup = require('.');
const installationCreated = require('../fixtures/webhooks/installation.created.json');
const installationDeleted = require('../fixtures/webhooks/installation.deleted.json');

describe('Integration: tracking GitHub installations', () => {
  test('installation created records', async () => {
    const { robot } = setup()

    await robot.receive({
      event: 'installation',
      payload: installationCreated,
    });

    let installation = await robot.models.Installation.findOne({
      where: { githubId: installationCreated.installation.id } });

    expect(installation).toBeTruthy();

    await robot.receive({
      event: 'installation',
      payload: installationDeleted,
    });

    installation = await robot.models.Installation.findOne({
      where: { githubId: installationCreated.installation.id } });

    expect(installation).toBe(null);
  });
});
