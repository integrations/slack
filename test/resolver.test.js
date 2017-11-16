const Resolver = require('../lib/resolver');
const nockBack = require('nock').back;
const GitHubAPI = require('github');

describe('Resolver', () => {
  let resolver;
  let github;

  beforeEach(() => {
    github = new GitHubAPI();
    resolver = new Resolver(github);
  });

  describe('resource', () => {
    test('https://github.com/wilhelmklopp/howtochangetheworld', (done) => {
      nockBack('repo.json', async (nockDone) => {
        const resource = await resolver.resource('https://github.com/wilhelmklopp/howtochangetheworld');
        nockDone();
        expect(resource).toEqual(expect.objectContaining({
          url: 'https://api.github.com/repos/wilhelmklopp/howtochangetheworld',
          id: 92596770,
          full_name: 'wilhelmklopp/howtochangetheworld',
        }));

        done();
      });
    });
  });
});
