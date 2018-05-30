const axios = require('axios');

const githubUrl = require('../github-url');
const DialogSubmissionError = require('../messages/create/dialog-submission-error');
const CommentCreated = require('../messages/create/comment-created');
const dialogs = require('../dialogs');

async function openDialog(req, res) {
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

async function createCommentDialogSubmission(req, res) {
  const { response_url, submission } = req.body;
  const { issueId, url, comment } = submission;

  if (!(issueId || url)) {
    return res.send({
      errors: [
        {
          name: 'issueId',
          error: 'You need to either select an issue or pull request in the list or supply a URL',
        },
        {
          name: 'url',
          error: 'You need to either select an issue or pull request in the list or supply a URL',
        },
      ],
    });
  }

  let resource;
  if (url) {
    resource = githubUrl(url);

    if (!(resource.type === 'issue' || resource.type === 'pull')) {
      return res.send({
        errors: [{
          name: 'url',
          error: 'The URL needs to link to either an issue or a pull request',
        }],
      });
    }
  }

  // TODO: Should check here whether we have write access
  //  on that repo for issues and if not return an error

  // Respond to Slack immediately to avoid timeout error message shown to user
  const { slackUser, robot } = res.locals;

  let data;
  try {
    if (url) {
      ({ data } = await slackUser.GitHubUser.client.issues.createComment({
        ...resource,
        type: undefined,
        body: comment,
      }));
    } else {
      const addComment = `
        mutation comment($id: ID!, $body: String!) {
          addComment(input: {subjectId: $id, body: $body}) {
            commentEdge {
              node {
                url
              }
            }
          }
        }`;
      data = (await slackUser.GitHubUser.client.query(
        addComment,
        { id: issueId, body: comment },
      ));
    }
  } catch (err) {
    if (!(err.code && err.code === 404) && !(err.name && err.name === 'GraphQLError')) {
      throw err;
    }
    req.log.debug({ err }, 'Could not create comment');

    const appUrl = (await robot.info()).html_url;
    await axios.post(response_url, new DialogSubmissionError('Could not create comment', submission, appUrl, resource).toJSON());
    return res.send();
  }

  let issueUrl;
  if (data.html_url) {
    issueUrl = data.html_url;
  } else {
    issueUrl = data.addComment.commentEdge.node.url;
  }

  await axios.post(response_url, {
    response_type: 'ephemeral',
    attachments: [new CommentCreated(issueUrl).getAttachment()],
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
          title
          number
          id
          repository {
            nameWithOwner
          }
        }
      }
    pullRequests(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        title
        number
        id
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
        value: issue.id,
      });
    } else {
      issuesByRepo[issue.repository.nameWithOwner] = [
        {
          label: formatLabel(issue),
          value: issue.id,
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
  createCommentDialogSubmission,
  openDialog,
  loadIssuesAndPrs,
};
