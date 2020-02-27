const SearchResult = require('../../lib/messages/search-result');
const fixtures = require('../fixtures');

const resource = { owner: 'kubernetes', repo: 'kubernetes' };

describe('Search results rendering', () => {
  test('renders results', () => {
    const searchResultMessage = new SearchResult(fixtures.searchResult.success.items, resource);
    expect(searchResultMessage.toJSON()).toMatchSnapshot();
  });
  test('handles empty results', () => {
    const searchResultMessage = new SearchResult(fixtures.searchResult.empty.items, resource);
    expect(searchResultMessage.toJSON()).toMatchSnapshot();
  });
});
