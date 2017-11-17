const unfurl = require('../../lib/slack/unfurl');
const fixtures = require('../fixtures');

describe('Link unfurling', () => {
  let github;

  beforeEach(() => {
    github = {
      issues: {
        get: jest.fn().mockImplementation(() => Promise.resolve({
          data: fixtures.issue,
        })),
        getComment: jest.fn().mockImplementation(() => Promise.resolve({
          data: fixtures.comment,
        })),
      },
      pullRequests: {
        get: jest.fn().mockImplementation(() => Promise.resolve({
          data: fixtures.pull,
        })),
      },
      users: {
        getForUser: jest.fn().mockImplementation(() => Promise.resolve({
          data: fixtures.user,
        })),
      },
      repos: {
        getContent: jest.fn().mockImplementation(() => Promise.resolve({
          data: fixtures.contents,
        })),
        get: jest.fn().mockImplementation(() => Promise.resolve({
          data: fixtures.repo,
        })),
      },
    };
  });

  test('works for issues', async () => {
    const url = 'https://github.com/facebook/react/issues/10191';
    const response = await unfurl(github, url, 'full');

    expect(response.title).toEqual('#10191 Consider re-licensing to AL v2.0, as RocksDB has just done');
    expect(response.title_link).toEqual(url);
  });

  test('works for pull requests', async () => {
    const url = 'https://github.com/github/hub/pull/1535';
    const response = await unfurl(github, url, 'full');

    expect(response.title).toEqual('#1535 Make fork command idempotent');
    expect(response.title_link).toEqual(url);
  });

  test('works for comments', async () => {
    const url = 'https://github.com/github/hub/pull/1535#issuecomment-322500379';
    const response = await unfurl(github, url, 'full');

    expect(response.text).toMatch(/Thanks for your work on this!/);
  });

  test('works for file with line numbers', async () => {
    const url = 'https://github.com/atom/atom/blob/master/src/color.js#L122-L129';
    const response = await unfurl(github, url, 'full');

    expect(response.text).toMatch(/function parseAlpha/);
    expect(response.text).toMatch(/Math\.max/);
  });

  test('works for accounts', async () => {
    const url = 'https://github.com/wilhelmklopp';
    const response = await unfurl(github, url, 'full');

    expect(response.title).toMatch('Wilhelm Klopp');
  });

  test('works for repos', async () => {
    const url = 'https://github.com/bkeepers/dotenv';
    const response = await unfurl(github, url, 'full');

    expect(response.title).toMatch('bkeepers/dotenv');
  });
});
