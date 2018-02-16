# GitHub + Slack Integration

[![Greenkeeper badge](https://badges.greenkeeper.io/github-slack/app.svg?token=8913ec8893877bdfb8fd9b036d1f54ddc1738c6c0d06dc1462bf9e9a088b13ad&ts=1513745376664)](https://greenkeeper.io/)
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

1. Go to the **OAuth & Permissions** tab, click **Add a new Redirect URL** and enter `https://DOMAIN/slack/oauth/callback` and click **Save URLs**

1. Scroll down to **Select Permission Scopes**, add `links:read`, `links:write`, and `chat:write` and click **Save Changes**

1. Run `script/server` to start the server

1. On the **Event Subscriptions** tab, set **Request URL** to `https://DOMAIN/slack/events`, replacing `YOUR-USERNAME` with the value that shows up when the server starts. Slack should show **Verified ✓** if all is well.

1. Scroll down to **App Unfurl Domains**, click **Add Domain** and enter `github.com`

1. Click **Save Changes**

1. Go to `https://DOMAIN/` and click the **Add to Slack** button to install the app

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

# Documentation 
## About
The GitHub integration for Slack gives you and your teams full visibility into your GitHub projects right in Slack channels, where you can generate ideas, triage issues and collaborate with other teams to move projects forward. This integration is an open source project, built and maintained by GitHub.

## Table of Contents
- [Installing the GitHub integration for Slack](#installing-the-gitHub-slack-app)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Authorization](#authorization)
- Getting Started
  - [Migrating from the legacy GitHub integration for Slack](#migrating-from-the-legacy-github-integration-for-slack)
  - [Repository Activity](#repository-activity)
  - [Types of Link Unfurls](#types-of-link-unfurls)
- [Feedback](#feedback-questions-need-help)
--------
## Installing the GitHub integration for Slack 
### Requirements
This app officially supports GitHub.com and Slack.com but the team plans to support GitHub Enterprise and Slack Enterprise Grid in the future.

### Migrating from the legacy GitHub integration for Slack
So, you've decided to migrate! When you install the new GitHub integration for Slack in your Slack Workspace, all existing configurations on the legacy app will be disabled. The GitHub integration for Slack will prompt you with a list of the previous configurations allowing you to re-enable those configurations for the new app.

![image](https://user-images.githubusercontent.com/3877742/35130921-3308f476-fc78-11e7-945c-0a4a9444987f.png)

### Installation
[Install the GitHub integration for Slack ](https://slack.com/apps/A8GBNUWU8-github). After you've signed in to your Slack workspace, you will be prompted to give the app access:

  ![install the Slack App](https://user-images.githubusercontent.com/173/34171552-54be5c18-e4b4-11e7-8254-8ca4833bb9a2.png)

After the app is installed, you will see **public** links to GitHub issues, pull requests, and code rendered as rich text via a [Slack unfurl](https://api.slack.com/docs/message-link-unfurling) in your workspace.

<img width="683" alt="unfurl_comment" src="https://user-images.githubusercontent.com/3877742/35711876-243c6bf6-0774-11e8-900a-dd39e2073882.png">

<img width="676" alt="unfurl_code" src="https://user-images.githubusercontent.com/3877742/35712003-cb718b7c-0774-11e8-897f-6e0cce74c0dc.png">

### Subscribing and Unsubscribing

At this point, your Slack and GitHub user accounts are not linked. To link the two accounts, authenticate to GitHub using a `/github` slash command, `/github signin`.

The `/github` slash command also accepts a `subscribe` argument that you can use to subscribe to an Organization or Repository's activity `/github subscribe <organization>/<repository>`.

![notification](https://user-images.githubusercontent.com/173/34171836-7d6b1c54-e4b5-11e7-818d-f824368d1803.png)

The `/github` slash command also supports `unsubscribe`. To unsubscribe to notifications from a repository, use `/github unsubscribe <organization>/<repository>`

### Authorization
By granting the app access, you are providing the following authorizations to your GitHub and Slack accounts:

#### Slack Permission Scopes

|Permission scope|Why we need it|
|---|---|
|Access private conversations between you and the App | To message you with instructions.  |
|View links to GitHub.com in messages| To render rich links from `github.com`|
|Add link previews to GitHub.com to messages| To render rich links to `github.com`|
|Add slash commands| To add the `/github` slash command to your Slack workspace |
|View the workspace or organization's name, email domain, and icon| To store subscriptions you set up|
|Post messages as the app| To notify you of activity that happens on GitHub, in Slack|

#### GitHub Permission Scopes

|Permission scope|Why we need it|
|---|---|
|Read access to code| To render code snippets in Slack|
|Read access to commit statuses, deployments, issues, metadata, pull requests, and repository projects | To render previews of links shared in Slack|

### Repository Activity
**Subscribe to an Organization or a Repository**
On repositories, the app notifies of `open`, `close`, and `re-open` events on pull requests and issues in repositories you've subscribed to. It also notifies of any `push` directly to the repository's default branch. 

All event notifications will render rich notifications (unfurls) including more information about the parent pull request or issue.

### Types of Link Unfurls
When a user posts a GitHub link in Slack, the app is designed to unfurl **issues and pull requests**,
directly linked **comments**, code **blobs** with line numbers, as well as **organizations, repositories, and users**.

## Feedback? Questions? Need help?
Please email support@github.com. 

