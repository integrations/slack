const expect = require('expect');
const unfurl = require('../lib/unfurl');

describe('Link unfurling', () => {
  let github;

  beforeEach(() => {
    github = {
      issues: {
        get: expect.createSpy().andReturn(Promise.resolve({
          data: require('./fixtures/issue')
        })),
        getComment: expect.createSpy().andReturn(Promise.resolve({
          data: require('./fixtures/comment')
        })),
      },
      pullRequests: {
        get: expect.createSpy().andReturn(Promise.resolve({
          data: require('./fixtures/pull')
        }))
      }
    };
  });

  it('works for issues', async () => {
    const url = "https://github.com/facebook/react/issues/10191";
    const response = await unfurl(github, url);

    expect(response.title).toEqual("#10191 Consider re-licensing to AL v2.0, as RocksDB has just done");
    expect(response.title_link).toEqual(url);
  });

  it('works for pull requests', async () => {
    const url = "https://github.com/github/hub/pull/1535";
    const response = await unfurl(github, url);

    expect(response.title).toEqual("#1535 Make fork command idempotent");
    expect(response.title_link).toEqual(url);
  });

  it('works for comments', async () => {
    const url = "https://github.com/github/hub/pull/1535#issuecomment-322500379";
    const response = await unfurl(github, url);

    expect(response.text).toMatch(/Thanks for your work on this!/);
  });
});
