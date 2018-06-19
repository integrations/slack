module.exports = `
  query {
    viewer {
      issues(first: 50, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          url
          title
          number
          repository {
            nameWithOwner
          }
        }
      }
      pullRequests(first: 50, orderBy: {field: UPDATED_AT, direction: DESC}) {
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
