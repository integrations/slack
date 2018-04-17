# GitHub+Slack API

The GitHub+Slack API allows you to post messages to Slack for a specific repository, and that message will be delivered based on your existing subscriptions.

## Usage

```
curl -xPOST -H "Authorization: token $token" \
   https://slack.github.com/repos/:owner/:repo
   -d "$message"
```

Where:

- `$token` is any valid GitHub token (personal access token, OAuth token, GitHub App token) that has write access to `:owner/:repo`
- `$message` is any valid payload for a [slack message](https://api.slack.com/docs/messages)
