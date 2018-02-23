const { Repository } = require('../../messages/repository');

module.exports = async (params, github, unfurlType) => {
  const { owner, repo } = params;
  const repository = await github.repos.get({ owner, repo });
  const repositoryMessage = new Repository({ repository: repository.data, unfurlType });
  return repositoryMessage.getRenderedMessage();
};
