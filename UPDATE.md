#personal/slack-github

This integration allows users to create issues using the message_actions api.

## Whats changed

### New ‘create-issue’ route

Route:
`/actions:interactive_message:actions:create-issue`

This route simply builds a dialog window object and returns to slack.

Dialog Object

```javascript
const dialog = {
  callback_id: "create-issue-dialog",
  title: "Open new issue",
  submit_label: "Open",
  elements: [
    {
      label: "Repository",
      type: "select",
      name: "repository",
      data_source: "external"
    },
    {
      type: "text",
      label: "Title",
      name: "title"
    },
    {
      type: "textarea",
      label: "Write",
      value: message.text,
      name: "body",
      placeholder: "Leave a comment",
      hint:
        "GitHub markdown syntax is supported, although you cannot preview it in Slack."
    }
  ]
};
```

This is the same as the `/open` object except for two major differences:

    * It uses `data_source: external` to allow us to load the repos later. This makes the dialog box open as quickly as possible.

    * Instead of returning a single repo, it returns multiple repos that the user can select.

### New Route: `/repo`

This route is called once the dialog box has opened to fill in the list of repos. This gets all the repos that the user can access.

Returned from /repo

```javascript
const repos = [
  { label: "username/reponame", value: 12345 },
  { label: "username/reponame", value: 54321 }
	...
]
```

## Changes needed on the Slack app

There are minor changes needed on the slack app settings to enable the message_actions.

### Action Settings

Simply create a new action with a callback ID of ‘create-issue’

![action settings](https://dzwonsemrish7.cloudfront.net/items/1i3O1O1v0b2d290W3M14/action_settings.png)

### Message Menus

This is the settings that allow for us to dynamically fill the select option with the users repo. Simply add the URL `<DOMAIN>/slack/repos`

![message menus](https://dzwonsemrish7.cloudfront.net/items/3Q3Z050T0U3s1w1z0M1N/%5B4b9b121d6efe8eb7ce729244146c0fc8%5D_message_menus.png)
