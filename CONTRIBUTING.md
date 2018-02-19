# Contributing

[fork]: https://github.com/github-slack/app/fork
[pr]: https://github.com/github-slack/app/compare
[style]: https://standardjs.com/
[code-of-conduct]: CODE_OF_CONDUCT.md

Hi there! We're thrilled that you'd like to contribute to this project. Your help is essential for keeping it great.

## Contents

- [Notices](#notices)
- [Getting started](#getting-started)
- [Submitting a pull request](#submitting-a-pull-request)
- [Resources](#resources)

## Notices

Contributions to this project are [released](https://help.github.com/articles/github-terms-of-service/#6-contributions-under-repository-license) to the public under the [project's open source license](LICENSE.md).

Please note that this project is released with a [Contributor Code of Conduct][code-of-conduct]. By participating in this project you agree to abide by its terms.

## Getting Started

This app is written in [ES6 JavaScript](https://nodejs.org/en/docs/es6/) and runs on [Node.js](https://nodejs.org/). After cloning the repository, install the dependencies by running:

```
$ script/bootstrap
```

To run the app locally, you will need to configure a GitHub App and a Slack App.

#### Configuring a GitHub App

Following the [Probot docs for configuring up a GitHub App](https://probot.github.io/docs/development/#configure-a-github-app), with the only difference being these values for the GitHub App settings:

- **Webhook URL**: `https://DOMAIN/github/events`
- **Setup URL**: `https://DOMAIN/github/setup`

#### Configuring a Slack App

1. [Create a new Slack app](https://api.slack.com/apps?new_app_token=1). Note that this app uses the new [workspace token-based Slack app](https://api.slack.com/slack-apps-preview).

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

## Submitting a pull request

0. [Fork][fork] and clone the repository
0. Configure and install the dependencies: `script/bootstrap`
0. Make sure the tests pass on your machine: `npm test`
0. Create a new branch: `git checkout -b my-branch-name`
0. Make your change, add tests, and make sure the tests still pass
0. Push to your fork and [submit a pull request][pr]
0. Pat your self on the back and wait for your pull request to be reviewed and merged.

Here are a few things you can do that will increase the likelihood of your pull request being accepted:

- Follow the [style guide][style].
- Write tests.
- Keep your change as focused as possible. If there are multiple changes you would like to make that are not dependent upon each other, consider submitting them as separate pull requests.
- Write a [good commit message](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html).

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://help.github.com)
