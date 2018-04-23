# GitHub+Slack API

> **Heads Up!** This api is experimental and subject to change anytime without notice. It is not supported for production use. Please share you your feedback on [#478](https://github.com/integrations/slack/issues/478).

The GitHub+Slack API allows you to post messages to Slack for a specific repository, and that message will be delivered based on your existing subscriptions.

## Usage

```
curl -XPOST -H "Authorization: token $token" \
   https://slack.github.com/repos/:owner/:repo
   -d "$message"
```

Where:

- `$token` is any valid GitHub token (personal access token, OAuth token, GitHub App token) that has write access to `:owner/:repo`
- `$message` is one or more valid [Slack attachments](https://api.slack.com/docs/message-attachments)
