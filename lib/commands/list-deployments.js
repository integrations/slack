const DeploymentList = require('../messages/deployment-list');

function getLatestDeployments(deployments) {
  return Object.values(deployments.reduce((latestDeployments, deployment) => {
    if (!latestDeployments[deployment.environment]) {
      return {
        ...latestDeployments,
        [deployment.environment]: deployment,
      };
    }
    return latestDeployments;
  }, {}));
}

/**
 * Lists all deployments of a repository
 *
 * Usage:
 *   /github deploy owner/repo list
 */
module.exports = async (req, res, next) => {
  const { command, resource, slackUser } = res.locals;

  if (command.args[1] !== 'list') {
    next();
    return;
  }

  const { owner, repo } = resource;

  const query = `
    query {
      repository (owner:"${owner}" name:"${repo}") {
        deployments (last:100, orderBy: { field:CREATED_AT, direction:DESC}) {
          nodes {
            creator {
              login,
              url
            },
            ref {
              name
            },
            commit {
              message,
              abbreviatedOid,
              commitUrl
            },
            description,
            task,
            environment,
            state,
            createdAt,
            latestStatus {
              state,
              description
            }
          }
        }
      }
    }`;
  const { data } = await slackUser.GitHubUser.client.request({
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    method: 'POST',
    url: '/graphql',
    query,
  });
  // Data did not come back through GraphQL, throw error
  if (data.errors && data.errors[0].type === 'FORBIDDEN') {
    // TODO: Abstract into our own error handling model
    const e = new Error(`Error received during request: list-deployments. Data returned:\n${data}`);
    e.code = 404;
    throw e;
  }
  const { data: { repository: { deployments: { nodes: deployments } } } } = data;
  const json = new DeploymentList(getLatestDeployments(deployments), resource).toJSON();
  return command.respond(json);
};
