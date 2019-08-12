# Contributing

[fork]: https://github.com/github-slack/app/fork
[pr]: https://github.com/github-slack/app/compare
[style]: https://standardjs.com/
[code-of-conduct]: CODE_OF_CONDUCT.md

Hi there! We're thrilled that you'd like to contribute to this project. Your help is essential for keeping it great.

## Contents

- [Notices](#notices)
- [Requesting New Features and Reporting Bugs](#requesting-new-features-and-reporting-bugs)
- [Getting started](#getting-started)
- [Submitting a pull request](#submitting-a-pull-request)
- [Resources](#resources)

## Notices

Contributions to this project are [released](https://help.github.com/articles/github-terms-of-service/#6-contributions-under-repository-license) to the public under the [project's open source license](LICENSE).

Please note that this project is released with a [Contributor Code of Conduct][code-of-conduct]. By participating in this project you agree to abide by its terms.

## Requesting New Features and Reporting Bugs

> **Heads up!** The team at GitHub is not actively working on new features for the GitHub + Slack integration. We will still be deploying security/bug fixes and reviewing community contributions. If you would like to help implement an improvement, [read more about contributing](https://github.com/integrations/slack/blob/master/CONTRIBUTING.md#getting-started) and consider submitting a pull request.

Bugs and feature requests are tracked as issues in this repository.

Before opening a new issue:
* **check [the README](https://github.com/integrations/slack/blob/master/README.md)** to see if the behavior you observed might be expected and if configuration options are available to provide you with the desired behavior.
* **perform a cursory search** to see if there's [an existing issue](https://github.com/integrations/slack/issues) covering your feedback. If there is one and the issue is still open, **add a :+1: reaction** on the issue to express interest in the issue being resolved. That will help the team gauge interest without the noise of comments which trigger notifications to all watchers. Comments should be used only if you have new and useful information to share.
* **consider if you're giving feedback which involves sharing sensitive information** (e.g. the name of your private repository). If you're concerned about sharing such information in a public repository, please reach out via [GitHub Support](https://github.com/contact?form%5Bsubject%5D=Re:+GitHub%2BSlack+Integration) instead to provide that feedback.

When opening an issue for a feature request:
* **use a clear and descriptive title** for the issue to identify the problem.
* **include as many details as possible in the body**. Explain your use-case, the problems you're hitting and the solutions you'd like to see to address those problems.

When opening an issue for a bug report, explain the problem and include additional details to help maintainers reproduce the problem:
* **describe the exact steps which reproduce the problem** in as many details as possible. When listing steps, don't just say what you did, but explain how you did it.
* **provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples. If you're providing snippets in the issue, use Markdown code blocks.
* **describe the behavior you observed** after following the steps and point out what exactly is the problem with that behavior.
* **explain which behavior you expected to see instead** and why.

## Getting Started

This app is written in [ES6 JavaScript](https://nodejs.org/en/docs/es6/) and runs on [Node.js](https://nodejs.org/). After cloning the repository, install the dependencies by running:

```
$ script/bootstrap
```

This will install `redis` and `postgres`, which are required to run the app. You will need to
start up the servers, and then run:

```
$ script/db_create
```

This set up the databases and keep their schemas up to date. You can verify that your code is setup correctly by running:

```
$ npm test
```

The next step for running the app locally is to configure both a GitHub App and a Slack App. For both of these you will likely need to use a tool like [ngrok](https://ngrok.com) to expose a URL publicly (referred to as `DOMAIN` in these docs) which will tunnel traffic back to your computer.

#### Configuring a GitHub App

Follow the [Probot docs for configuring up a GitHub App](https://probot.github.io/docs/development/#configuring-a-github-app) skipping the addition of `WEBHOOK_PROXY_URL` to your `.env` file. The only other difference being these values for the GitHub App settings:

- **User authorization callback URL**: `https://DOMAIN/github/oauth/callback`
- **Setup URL**: `https://DOMAIN/github/setup`
- **Webhook URL**: `https://DOMAIN/github/events`

Your new GitHub app will need the following permissions:

- Checks: Read-only
- Repository contents: Read-only
- Deployments: Read & write
- Issues: Read & write
- Repository metadata: Read-only
- Pull requests: Read & write
- Commit statuses: Read-only

It will also need the following event subscriptions:

- Check run
- Check suite
- Commit comment
- Create
- Delete
- Deployment
- Deployment status
- Issue comment
- Issues
- Public
- Pull request
- Pull request review
- Pull request review comment
- Push
- Release
- Repository
- Status

- Add in a `STORAGE_SECRET` to your `.env` file, running `openssl rand -hex 32` should provide a suitable secret.
- Add in a `SESSION_SECRET` to your `.env` file, running `openssl rand -hex 32` should provide a suitable secret.

#### Configuring a Slack App

1. [Create a new Slack app](https://api.slack.com/apps?new_app_token=1). Note that this app uses the new [workspace token-based Slack app](https://api.slack.com/slack-apps-preview).

1. On the **Basic Information** tab, copy the values under the **App Credentials** section into `.env`.

1. Go to the **OAuth & Permissions** tab, click **Add a new Redirect URL** and enter `https://DOMAIN/slack/oauth/callback` and click **Save URLs**

1. Scroll down to **Select Permission Scopes**, add `links:read`, `links:write`, and `chat:write` and click **Save Changes**

1. Run `script/server` to start the server

1. On the **Interactive Components** tab, set **Request URL** to `https://DOMAIN/slack/actions`.

1. Under **Interactive Components** under **Actions**, click **Create New Action**

    ![](https://user-images.githubusercontent.com/2894107/60052628-6465c800-969b-11e9-943e-17ac8ef63302.png)

    - **Action Name**: `Comment on Issue or PR`
    - **Short Description**: `Comment on an Issue or Pull Request with the content of a Slack message`
    - **Callback ID**: `comment-action`
    - Click **Create**

1. Under **Interactive Components** under **Message Menus**, set **Options Load URL** to `https://DOMAIN/slack/options`

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
1. Go to the **Interactive Components** tab and click **Enable Interactive components**:

    - **Request URL**: `https://DOMAIN/slack/actions`
    - click **Enable Interactive components**

1. Congratulate yourself for following directions and clicking buttons. Take the rest of the day off because that was a lot of work.

## Adding new features

### Activity

Activity features are those that post a new message in Slack when activity happens on GitHub. For example when an issue is opened on GitHub, then a corresponding message is posted in all Slack channels that have subscribed to the repo on which the issue was opened.

There are a few different parts to each activity feature (and thus any new activity feature):
- Listening to the relevant webhook (for example `issues.opened` for the "issues" activity feature) in `lib/activity/index.js`
- The format of the message posted to Slack in `lib/messages/[feature].js`
- Connecting the webhook event to the formatted message and any other relevant logic (such as caching, fetching additional data) in `lib/activity/[feature].js`

In order to create a new activity feature, create a new file in `lib/activity/`, a new file in `lib/messages/`, listen to the webhook event in `lib/activity/index.js` and generally follow the patterns used in existing activity features.

> Note: All current activity features are for events that occur on repositories (in line with the architecture of GitHub Apps). Adding activity features for events that happen outside of repositories, such as organization events, is still possible, but will require significant changes to the existing setup.

The below diagram describes the lifecycle of an activity message delivery to a level of detail that is intended to give a good intuition of how activity features work.
![activity message delivery](https://user-images.githubusercontent.com/7718702/42683224-4d72e732-86bf-11e8-89eb-0311c1eace7b.png)

### Unfurls

Unfurls describe the set of features that are called "rich link previews" in user facing documentation. When a user posts a link to some github.com resources in Slack, the link will automatically "unfurl" showing you some information about the resource such as the title, body, state (open/closed), etc.

Each unfurl consists of a few things:
- A regular expression in the `routes` object in`lib/github-url.js` that matches the type of URL that you want to unfurl to the resource
- A file in `lib/unfurls/[unfurl].js` that includes fetching data about the resource from the GitHub API ahead of formatting the unfurl
- A reference to the previous file in the `resources` object in `lib/models/unfurl.js` just like it is done for existing unfurls
- The format of the Slack message ("the unfurl") in `lib/messages/[unfurl].js` (sometimes this formatting is shared with activity features)

The below diagram describes the lifecycle of an unfurl to a level of detail that is intended to give a good intuition of how unfurls work.
![unfurl diagram](https://user-images.githubusercontent.com/7718702/42746859-7067aa9e-890c-11e8-9ff0-50b975b37a86.png)

1. Receive `link_shared` event from Slack
1. Check if link is eligible for unfurls
1. Get token of the user who shared the link
1. Make request to GitHub to fetch resource
1. Format the message so that Slack can render it
1. `chat.unfurl` API call to Slack

## Memory requirements

By default, tests run with a GC memory limit of 4GB. This helps us to avoid slow and failing tests caused by GC runs.
If this is too much for your local system you can set `NODE_OPTIONS` to set a custom value. Example for 2GB:

`NODE_OPTIONS="--max-old-space-size=2048" npm test`

V8's default is 1.5GB so we recommend not using a value less than that.

## Troubleshooting

* Tests fail with something similar to:

  ```
  SequelizeForeignKeyConstraintError: insert or update on table "SlackUsers" violates foreign key constraint "slackWorkspaceId_foreign_idx"
  ```

  Means you aren't running postgres and redis when your tests are running.

* Requests to `https://DOMAIN/github/events` from your GitHub app fail with:

  ```
  ERROR http: No X-Hub-Signature found on request
  ```

  Means you've not set the "Webhook secret" on your GitHub App to be `"development"`.

* `script/server` failing to connect in the following fashion.

  ```
  $ script/server

  > @ start /integrations/slack
  > probot run --webhook-path=/github/events ./lib

  13:23:04.150Z  INFO probot: Forwarding https://DOMAIN to http://localhost:3000/github/events
  13:23:04.154Z  INFO probot: Listening on http://localhost:3000
  13:23:04.364Z  INFO http: GET / 200 - 55.34 ms (id=df405c97-d0e2-4379-a50c-3beb54135ed6)
  13:23:04.398Z  INFO probot: Connected https://DOMAIN
  13:23:04.405Z ERROR probot:  (type=error)
  13:23:04.514Z  INFO http: GET / 200 - 2.71 ms (id=b4a375c6-d1f6-4dcc-ba9c-337947ce58ca)
  13:23:04.550Z  INFO probot: Connected https://DOMAIN
  13:23:04.555Z ERROR probot:  (type=error)
  13:23:04.666Z  INFO http: GET / 200 - 1.94 ms (id=1d1706a8-9b9d-4845-a62c-08fd1e9801f6)
  13:23:04.704Z  INFO probot: Connected https://DOMAIN
  13:23:04.705Z ERROR probot:  (type=error)
  ... repeated until process killed ....
  ```

  Means you have `WEBHOOK_PROXY_URL` set in your `.env` file. Remove it and try again.

## Submitting a pull request

1. [Fork][fork] and clone the repository
1. Configure and install the dependencies: `script/bootstrap`
1. Make sure the tests pass on your machine: `npm test`
1. Create a new branch: `git checkout -b my-branch-name`
1. Make your change, add tests, and make sure the tests still pass
1. Push to your fork and [submit a pull request][pr]
1. Pat your self on the back and wait for your pull request to be reviewed and merged.

Here are a few things you can do that will increase the likelihood of your pull request being accepted:

- Follow the [style guide][style].
- Write tests.
- Keep your change as focused as possible. If there are multiple changes you would like to make that are not dependent upon each other, consider submitting them as separate pull requests.
- Write a [good commit message](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html).

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://help.github.com)
