const SearchResult = require('../messages/search-result');

/**
 * Searches a repository
 *
 * Usage:
 *   /github search owner/repo search term
 */
module.exports = async (req, res) => {
  const { command, resource, slackUser } = res.locals;

  const { owner, repo } = resource;
  const searchTerm = command.args.join(' ');
  const query = `${searchTerm}+repo:${owner}/${repo}`;

  const { data } = await slackUser.GitHubUser.client.request({
    headers: {
      accept: 'application/json',
    },
    method: 'GET',
    url: `/search/code?q=${encodeURIComponent(query)}`,
  });
  const { items } = data;
  const json = new SearchResult(items, resource).toJSON();
  return command.respond(json);
};
