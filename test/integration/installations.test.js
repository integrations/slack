const helper = require('.');
const installationCreated = require('../fixtures/webhooks/installation.created.json');
const installationDeleted = require('../fixtures/webhooks/installation.deleted.json');

describe('Integration: tracking GitHub installations', () => {
  test('installation created records', async () => {
    const { robot } = helper;
    const { Installation } = robot.models;

    await robot.receive({
      event: 'installation',
      payload: installationCreated,
    });

    let installation = await Installation.findOne({
      where: { githubId: installationCreated.installation.id } });

    console.log('WTF?', await Installation.findAll());

    expect(installation).toBeTruthy();

    await robot.receive({
      event: 'installation',
      payload: installationDeleted,
    });

    installation = await Installation.findOne({
      where: { githubId: installationCreated.installation.id } });

    expect(installation).toBe(null);
  });
});
