/*
* Takes a list of repositories and a github client
* and returns a list of repository objects from the gitHub API
*/
const logger = require('../logger');

module.exports = async (repositoryIds, github) => {
  const repositories = await Promise.all(repositoryIds.map(async (id) => {
    try {
      const repository = await github.repos.getById({ id });
      return repository.data;
    } catch (err) {
      logger.error({ err, repoId: id }, 'Could not find repository');
      if (err.code !== 404) {
        throw err;
      }
    }
  }));

  // remove undefined
  return repositories.filter(repo => repo);
};
