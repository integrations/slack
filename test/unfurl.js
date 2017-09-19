const expect = require('expect');
const unfurl = require('../lib/unfurl');
const fixtures = require('./fixtures');

describe('Link unfurling', () => {
  let github;

  beforeEach(() => {
    github = {
      issues: {
        get: expect.createSpy().andReturn(Promise.resolve({
          data: fixtures.issue,
        })),
        getComment: expect.createSpy().andReturn(Promise.resolve({
          data: fixtures.comment,
        })),
      },
      pullRequests: {
        get: expect.createSpy().andReturn(Promise.resolve({
          data: fixtures.pull,
        })),
      },
      users: {
        getForUser: expect.createSpy().andReturn(Promise.resolve({
          data: fixtures.user,
        })),
      },
      repos: {
        getContent: expect.createSpy().andReturn(Promise.resolve({
          data: fixtures.contents,
        })),
      },
    };
  });

  it('works for issues', async () => {
    const url = 'https://github.com/facebook/react/issues/10191';
    const response = await unfurl(github, url);

    expect(response.title).toEqual('#10191 Consider re-licensing to AL v2.0, as RocksDB has just done');
    expect(response.title_link).toEqual(url);
  });

  it('works for pull requests', async () => {
    const url = 'https://github.com/github/hub/pull/1535';
    const response = await unfurl(github, url);

    expect(response.title).toEqual('#1535 Make fork command idempotent');
    expect(response.title_link).toEqual(url);
  });

  it('works for comments', async () => {
    const url = 'https://github.com/github/hub/pull/1535#issuecomment-322500379';
    const response = await unfurl(github, url);

    expect(response.text).toMatch(/Thanks for your work on this!/);
  });

  it('works for file with line numbers', async () => {
    const url = 'https://github.com/atom/atom/blob/master/src/color.js#L122-L129';
    const response = await unfurl(github, url);

    expect(response.text).toMatch(/function parseAlpha/);
    expect(response.text).toMatch(/Math\.max/);
  });

  it('works for profiles', async () => {
    const url = 'https://github.com/wilhelmklopp';
    const response = await unfurl(github, url);

    expect(response.title).toMatch('wilhelmklopp (Wilhelm Klopp)');
  });
});
