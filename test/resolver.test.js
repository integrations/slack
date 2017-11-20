const Resolver = require('../lib/resolver');
const nock = require('nock');
const GitHubAPI = require('github');
const repoFixture = require('./fixtures/repo');

describe('Resolver', () => {
  let resolver;
  let github;

  beforeEach(() => {
    github = new GitHubAPI();
    resolver = new Resolver(github);
  });

  describe('resource', () => {
    test('https://github.com/wilhelmklopp/howtochangetheworld', async () => {
      const scope = nock('https://api.github.com').get('/repos/bkeepers/dotenv')
        .reply(200, repoFixture);

      const resource = await resolver.resource('https://github.com/bkeepers/dotenv');

      expect(resource).toEqual(expect.objectContaining({
        url: 'https://api.github.com/repos/bkeepers/dotenv',
        id: 5160706,
        full_name: 'bkeepers/dotenv',
      }));

      expect(scope.isDone()).toBe(true);
    });
  });
});
