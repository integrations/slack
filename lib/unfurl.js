const REGEX = new RegExp("https://github.com/([^/]+)/([^/]+)/issues/(\\d+)");

module.exports = async (github, url) => {
  const [_, owner, repo, number] = url.match(REGEX);
  const issue = await github.issues.get({owner, repo, number});
  return {text: issue.data.title};
};
