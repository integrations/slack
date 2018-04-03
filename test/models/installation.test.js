const { Installation } = require('.');
const GitHub = require('probot/lib/github');
const logger = require('../../lib/logger');
const createdEvent = require('../fixtures/webhooks/installation.created');

const nock = require('nock');

describe('models.Installation', () => {
  describe('getForOwner', () => {
    test('returns model for owner', async () => {
      const expected = await Installation.create({ githubId: 1, ownerId: 2 });
      const actual = await Installation.getForOwner(2);
      expect(actual).toBeTruthy();
      expect(actual.id).toEqual(expected.id);
    });

    test('returns null for unknown', async () => {
      expect(await Installation.getForOwner(999)).toBe(null);
    });
  });

  test('install and uninstall', async () => {
    const installation = await Installation.install(createdEvent.installation);
    await installation.reload();
    expect(installation.githubId).toBe('68638');
    expect(await Installation.count()).toBe(1);

    await Installation.uninstall(createdEvent.installation);
    expect(await Installation.count()).toBe(0);
  });

  test('install updates old installation id', async () => {
    const installation = await Installation.install(createdEvent.installation);

    // Install with new id
    await Installation.install({
      ...createdEvent.installation,
      id: 123,
    });

    await installation.reload();

    expect(installation.githubId).toBe('123');
    expect(await Installation.count()).toBe(1);
  });

  test('sync fetches and returns installation', async () => {
    const github = new GitHub({ logger });

    nock('https://api.github.com').get('/repos/bkeepers/dotenv/installation')
      .reply(200, createdEvent.installation);

    const installation = await Installation.sync(github, { owner: 'bkeepers', repo: 'dotenv' });
    await installation.reload();

    expect(installation.githubId).toBe('68638');
    expect(await Installation.count()).toBe(1);
  });
});
