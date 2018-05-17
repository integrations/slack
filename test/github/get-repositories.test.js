const nock = require('nock');
const GitHub = require('probot/lib/github');

const logger = require('../../lib/logger');
const getRepositories = require('../../lib/github/get-repositories');

const github = new GitHub({ logger });

describe('get repositories by id', async () => {
  test('works for one repository', async () => {
    nock('https://api.github.com').get('/repositories/12345').reply(200, { full_name: 'integrations/slack' });
    const repositories = await getRepositories([12345], github);
    expect(repositories.length).toBe(1);
  });

  test('works for multiple repositories', async () => {
    nock('https://api.github.com').get('/repositories/12345').reply(200, { full_name: 'integrations/slack' });
    nock('https://api.github.com').get('/repositories/54321').reply(200, { full_name: 'integrations/test' });
    nock('https://api.github.com').get('/repositories/11111').reply(200, { full_name: 'integrations/snappydoo' });
    const repositories = await getRepositories([12345, 54321, 11111], github);
    expect(repositories.length).toBe(3);
  });

  test('works in case a repository cannot be found', async () => {
    nock('https://api.github.com').get('/repositories/12345').reply(200, { full_name: 'integrations/slack' });
    nock('https://api.github.com').get('/repositories/54321').reply(404);
    nock('https://api.github.com').get('/repositories/11111').reply(200, { full_name: 'integrations/snappydoo' });
    const repositories = await getRepositories([12345, 54321, 11111], github);
    expect(repositories.length).toBe(2);
  });

  test('throws error on >4xx status codes that are not 404', async () => {
    nock('https://api.github.com').get('/repositories/12345').reply(200, { full_name: 'integrations/slack' });
    nock('https://api.github.com').get('/repositories/54321').reply(401);
    nock('https://api.github.com').get('/repositories/11111').reply(200, { full_name: 'integrations/snappydoo' });
    await expect(getRepositories([12345, 54321, 11111], github)).rejects.toThrow();
  });
});
