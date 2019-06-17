module.exports = `
  query {
    viewer {
      issues(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          url
          title
          number
          repository {
            nameWithOwner
          }
        }
      }
      pullRequests(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          url
          title
          number
          repository {
            nameWithOwner
          }
        }
      }
    }
  }`;
