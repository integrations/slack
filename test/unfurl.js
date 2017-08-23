const expect = require('expect');
const unfurl = require('../lib/unfurl');
const issue = require('./fixtures/issue');

describe('Link unfurling', () => {
  let github;

  beforeEach(() => {
    github = {
      issues: {
        get: expect.createSpy().andReturn(Promise.resolve({
          data: issue
        }))
      }
    };
  });

  it('works', async () => {
    const url = "https://github.com/facebook/react/issues/10191";
    const response = await unfurl(github, url);
    expect(response).toEqual({
      "text": "Consider re-licensing to AL v2.0, as RocksDB has just done",
    });
  });
});
