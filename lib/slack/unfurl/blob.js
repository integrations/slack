const { Blob } = require('../renderer/blob');

module.exports = async (params, github, unfurlType) => {
  const { owner, repo, ref, path, line } = params;
  const blob = (await github.repos.getContent({ owner, repo, path, ref })).data;
  const repository = (await github.repos.get({ owner, repo })).data;
  const blobMessage = new Blob({ blob, line, repository, unfurlType });
  return blobMessage.getRenderedMessage();
};
