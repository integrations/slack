const axios = require('axios');

const githubUrl = require('../github-url');
const CommentCreated = require('../messages/create/comment-created');
const dialogs = require('../dialogs');
const { Installation } = require('../models');

async function open(req, res) {
  const { slackWorkspace } = res.locals;
  const {
    trigger_id,
    team,
    channel,
    message,
  } = req.body;

  await slackWorkspace.client.dialog.open({
    dialog: dialogs.addComment(message, channel, team),
    trigger_id,
  });
  return res.send();
}

async function submit(req, res) {
  const { slackUser, robot } = res.locals;
  const { response_url, submission } = req.body;
  const { selectedUrl, manualUrl, comment } = submission;

  if (!(selectedUrl || manualUrl)) {
    return res.send({
      errors: [
        {
          name: 'selectedUrl',
          error: 'You need to either select an issue or pull request in the list or supply a URL',
        },
        {
          name: 'manualUrl',
          error: 'You need to either select an issue or pull request in the list or supply a URL',
        },
      ],
    });
  }

  const url = selectedUrl || manualUrl;
  const resource = githubUrl(url);

  if (manualUrl) {
    // Validate URL only if manually supplied
    if (!(resource.type === 'issue' || resource.type === 'pull')) {
      return res.send({
        errors: [{
          name: 'manualUrl',
          error: 'The URL needs to link to either an issue or a pull request',
        }],
      });
    }
  }

  const permissions = {
    issues: 'write',
    pull_requests: 'write',
  };
  const { owner, repo } = resource;
  if (!(await Installation.assertPermissions(await robot.auth(), { owner, repo, permissions }))) {
    const appUrl = (await robot.info()).html_url;
    return res.send({
      errors: [{
        name: selectedUrl ? 'selectedUrl' : 'manualUrl',
        error: `Please install the Slack app on ${owner}/${repo} and grant any pending permission requests: ${appUrl}`,
      }],
    });
  }

  const { data } = await slackUser.GitHubUser.client.issues.createComment({
    ...resource,
    type: undefined,
    body: comment,
  });

  await axios.post(response_url, {
    response_type: 'ephemeral',
    attachments: [new CommentCreated(data.html_url).getAttachment()],
  });
  return res.send();
}

async function loadIssuesAndPrs(req, res) {
  function formatLabel(issue, includeRepository = false) {
    const label = `#${issue.number} ${issue.title}`;
    if (includeRepository) {
      return `[${issue.repository.nameWithOwner}] ${label}`;
    }
    if (label.length > 30) {
      return `${label.slice(0, 30).slice(0, -3)}...`;
    }
    return label;
  }

  const { slackUser } = res.locals;
  const { value } = req.body;

  const query = `
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
  const { data } = await slackUser.GitHubUser.client.request({
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    method: 'POST',
    url: '/graphql',
    query,
  });

  const { issues, pullRequests } = data.data.viewer;
  let rawIssues = issues.nodes.concat(pullRequests.nodes).filter(issue => issue);

  // If user supplied search term, then we filter based on the search term
  if (value) {
    rawIssues = rawIssues.filter(issue => formatLabel(issue, true).toLowerCase().includes(value));
  }

  // Slack permits a maximum of 100 options
  rawIssues = rawIssues.slice(0, 100);

  // Re-order all issues and PRs by repository for grouping in the dialog
  const issuesByRepo = {};
  rawIssues.forEach((issue) => {
    if (issuesByRepo[issue.repository.nameWithOwner]) {
      issuesByRepo[issue.repository.nameWithOwner].push({
        label: formatLabel(issue),
        value: issue.url,
      });
    } else {
      issuesByRepo[issue.repository.nameWithOwner] = [
        {
          label: formatLabel(issue),
          value: issue.url,
        },
      ];
    }
  });

  return res.send({
    option_groups: Object.keys(issuesByRepo).map(repo => ({
      label: repo,
      options: issuesByRepo[repo],
    })),
  });
}

module.exports = {
  open,
  submit,
  loadIssuesAndPrs,
};
