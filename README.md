# GitHub + Slack Integration
[![Build Status](https://travis-ci.org/github-slack/app.svg?branch=extract-unfurls)](https://travis-ci.org/github-slack/app) [![codecov](https://codecov.io/gh/github-slack/app/branch/master/graph/badge.svg?token=wGV2kENgLx)](https://codecov.io/gh/github-slack/app)

## Developing

This app is written in [ES6 JavaScript](https://nodejs.org/en/docs/es6/) and runs on [Node.js](https://nodejs.org/). After cloning the repository, install the dependencies by running:

```
$ script/bootstrap
```

To run the app locally, you will need to configure a GitHub App and a Slack App.

#### Configuring a GitHub App

Following the [Probot docs for configuring up a GitHub App](https://probot.github.io/docs/development/#configure-a-github-app). Append `/github/events` to the **Webhook URL**.

#### Configuring a Slack App

1. [Create a new Slack app](https://api.slack.com/apps?new_app=1)

1. On the **Basic Information** tab, copy the values under the **App Credentials** section into `.env`.

1. Go to the **OAuth & Permissions** tab, click **Add a new Redirect URL** and enter `https://DOMAN/slack/oauth/callback` and click **Save URLs**

1. Scroll down to **Select Permission Scopes**, add `links:read`, `links:write`, and `chat:write:user` and click **Save Changes**

1. On the **Install App** tab, click **Install App to Workspace**, click **Authorize**, and set `SLACK_ACCESS_TOKEN` in `.env` to the value of **OAuth Access Token**

1. Run `script/server` to start the server

1. On the **Event Subscriptions** tab, set **Request URL** to `https://YOUR-USERNAME.localtunnel.me/slack/events`, replacing `YOUR-USERNAME` with the value that shows up when the server starts. Slack should show **Verified ✓** if all is well.

1. Scroll down to **App Unfurl Domains**, click **Add Domain** and enter `github.com`

1. Click **Save Changes**

1. Paste a GitHub.com url in your slack channel and watch the magic happen.

    ![](https://user-images.githubusercontent.com/173/30975353-b0deb366-a437-11e7-854b-227399e7c993.png)

1. Go to the **Slash Commands** tab and click **Create New Command**:

  - **Command**: `/github`
  - **Request URL**: `https://DOMAIN/slack/command`
  - **Short Description**: `Subscribe to notifications for an Organization or Repository`
  - **Usage Hint**: `subscribe https://github.com/organization/repository`
  - Click **Save**
  - Test it out by typing `/github subscribe https://github.com/myorg/myrepo`

1. Congratulate yourself for following directions and clicking buttons. Take the rest of the day off because that was a lot of work.
