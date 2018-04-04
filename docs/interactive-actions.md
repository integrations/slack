# Interactive Actions

These are mockups for [interactive actions](https://github.com/integrations/slack/issues/475). Paste the JSON into Slack's [message builder](https://api.slack.com/docs/messages/builder) to see a preview, and see Slack's docs for [interactive messages](https://api.slack.com/interactive-messages) to see what all is possible.

## Issues

User types `/github owner/repo#123`

#### Open Issue

```json
{
  "attachments": [
    {
      "text": "TODO: condensed preview of issue"
    },
    {
      "text": "",
      "fallback": "",
      "callback_id": "action_issue",
      "color": "#3AA3E3",
      "attachment_type": "default",
      "actions": [
        {
          "name": "issue",
          "text": "Edit",
          "type": "button",
          "value": "edit"
        },
        {
          "name": "issue",
          "text": "Pick a label...",
          "type": "select",
          "options": [
            {
              "text": "bug",
              "value": "bug"
            },
            {
              "text": "duplicate",
              "value": "duplicate"
            },
            {
              "text": "enhancement",
              "value": "enhancement"
            },
            {
              "text": "help wanted",
              "value": "help wanted"
            },
            {
              "text": "invalid",
              "value": "invalid"
            },
            {
              "text": "question",
              "value": "question"
            },
            {
              "text": "wontfix",
              "value": "wontfix"
            }
          ]
        },
        {
          "name": "issue",
          "text": "Assign",
          "type": "select",
          "data_source": "users"
        },
        {
          "name": "issue",
          "text": "Close",
          "style": "danger",
          "type": "button",
          "value": "close",
          "confirm": {
            "title": "Are you sure?",
            "text": "Are you sure you want to close this issue?",
            "ok_text": "Close",
            "dismiss_text": "Cancel"
          }
        }
      ]
    }
  ]
}
```

#### Closed Issue

## Pull Requests

## Repository

#### Not Subscribed

```json
{
  "attachments": [
    {
      "text": "TODO: condensed preview of repository"
    },
    {
      "text": "",
      "callback_id": "action_repo",
      "color": "#3AA3E3",
      "attachment_type": "default",
      "actions": [
        {
          "name": "repo",
          "text": "Subscribe",
          "type": "button",
          "value": "assign"
        }
      ]
    }
  ]
}
```

#### Subscribed
