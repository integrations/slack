const repos = require('../../lib/actions/repos');

describe('Test Repo List for Action Message', () => {
  test('get', async () => {
    const res = {
      send: result => result,
      locals: {
        gitHubUser: {
          client: {
            users: {
              get: () => ({
                data: {
                  login: 'userName',
                },
              }),
            },
            repos: {
              getForUser: () => ({
                data: [
                  {
                    id: 123,
                    full_name: 'awesome/repo',
                  },
                  {
                    id: 321,
                    full_name: 'awesome/repo2',
                  },
                ],
              }),
            },
          },
        },
      },
    };

    const req = {};
    const result = await repos.get(req, res);

    expect(result).toMatchSnapshot();
  });
});
