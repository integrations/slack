const { Unfurl } = require('../../lib/models');
const fixtures = require('../fixtures');

describe('Unfurl getAttachment', () => {
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
    const { attachment } = await Unfurl.getAttachment(github, url, false, true);

    expect(attachment.title).toEqual('#10191 Consider re-licensing to AL v2.0, as RocksDB has just done');
    expect(attachment.title_link).toEqual(url);
  });

  test('works for pull requests', async () => {
    const url = 'https://github.com/github/hub/pull/1535';
    const { attachment } = await Unfurl.getAttachment(github, url, false, true);

    expect(attachment.title).toEqual('#1535 Make fork command idempotent');
    expect(attachment.title_link).toEqual(url);
  });

  test('works for comments', async () => {
    const url = 'https://github.com/github/hub/pull/1535#issuecomment-322500379';
    const { attachment } = await Unfurl.getAttachment(github, url, false, true);

    expect(attachment.text).toMatch(/Thanks for your work on this!/);
  });

  test('works for file with line numbers', async () => {
    const url = 'https://github.com/atom/atom/blob/master/src/color.js#L122-L129';
    const { attachment } = await Unfurl.getAttachment(github, url, false, true);

    expect(attachment.text).toMatch(/function parseAlpha/);
    expect(attachment.text).toMatch(/Math\.max/);
  });

  test('works for accounts', async () => {
    const url = 'https://github.com/wilhelmklopp';
    const { attachment } = await Unfurl.getAttachment(github, url, false, true);

    expect(attachment.title).toMatch('Wilhelm Klopp');
  });

  test('works for repos', async () => {
    const url = 'https://github.com/bkeepers/dotenv';
    const { attachment } = await Unfurl.getAttachment(github, url, false, true);

    expect(attachment.title).toMatch('bkeepers/dotenv');
  });

  test('promise rejected on unknown URL', async () => {
    const url = 'https://github.com/bkeepers/dotenv/evil-plans';
    expect.assertions(1);

    try {
      await Unfurl.getAttachment(github, url, false, true);
    } catch (e) {
      expect(e.toString()).toEqual(`UnsupportedResource: ${url}`);
    }
  });
});
