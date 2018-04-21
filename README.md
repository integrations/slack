# GitHub + Slack Integration
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
  - [Public Link Unfurls](#types-of-public-link-unfurls)
  - [Configuration](#configuration)
- [Need help?](#questions-need-help)
- [Contributing](#contributing)
- [License](#license)
--------
## Installing the GitHub integration for Slack
### Requirements
This app officially supports GitHub.com and Slack.com but the team plans to support GitHub Enterprise and Slack Enterprise Grid in the future.

### Migrating from the legacy GitHub integration for Slack
When you install the new GitHub integration for Slack in your Slack workspace, you'll be prompted to move over all of your existing subscriptions - so getting set up again is easy. As you enable individual subscriptions in the new app, your settings will be automatically migrated and subscriptions in the legacy app will be disabled.

<p align="center"><img width="666" alt="migration" src="https://user-images.githubusercontent.com/3877742/36557399-ff8663c6-17bc-11e8-8962-d92088cf98a9.png"></p>

### Installation
[Install the GitHub integration for Slack](https://slack.com/apps/A8GBNUWU8-github). After you've signed in to your Slack workspace, you will be prompted to give the app access:

<p align="center"><img width="450" alt="auth" src="https://user-images.githubusercontent.com/3877742/36522927-f1d596b6-1753-11e8-9f85-2495e657b16b.png"></p>

After the app is installed, you will see **public** links to GitHub issues, pull requests, and code rendered as rich text via a [Slack unfurl](https://api.slack.com/docs/message-link-unfurling) in your workspace.

<p align="center"><img width="550" alt="unfurl_convo" src="https://user-images.githubusercontent.com/3877742/36522313-c0cdbd08-1750-11e8-8dbe-b5a3a2f93549.png"></p>

### Subscribing and Unsubscribing

At this point, your Slack and GitHub user accounts are not linked. To link the two accounts, authenticate to GitHub using a `/github` slash command, `/github signin`.

The `/github` slash command also accepts a `subscribe` argument that you can use to subscribe to an Organization or Repository's activity `/github subscribe <organization>/<repository>`.

<p align="center"><img width="500" alt="unfurl_code" src="https://user-images.githubusercontent.com/3877742/36522323-ce7d4f36-1750-11e8-9eb2-b6f97c2d0053.png"></p>

If you originally gave the app access to "All repositories" and you've created a new private repository on GitHub after installing the GitHub integration for Slack, the `/github subscribe` command will work automatically on your new repository. If you installed the app on a subset of repositories, the app will prompt you to install it on the new repository.

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

#### Repository Activity
**Subscribe to an Organization or a Repository**
On repositories, the app notifies of `open`, `close`, and `re-open` events on pull requests and issues in repositories you've subscribed to. It also notifies of any `push` directly to the repository's default branch as well as `comments` on issues and pull requests.

#### Types of Public Link Unfurls
When a user posts a GitHub link in Slack for a public repository, the app is designed to unfurl **issues and pull requests**, directly linked **comments**, code **blobs** with line numbers, as well as **organizations, repositories, and users**.

Links won't be unfurled if:

- the repository is private (support for private links is coming soon!)
- link previews for `github.com` have been [disabled for your workspace](https://get.slack.help/hc/en-us/articles/204399343-Share-links-in-Slack#turn-off-link-previews-for-specific-sites)
- the same link was already shared in the last 30 minutes in the same channel
- 3 or more links are shared in the same chat message

### Configuration
You can customize your notifications by subscribing to activity that is relevant to your Slack channel, and unsubscribing from activity that is less helpful to your project.

Settings are configured with the `/github` slash command:

```
/github subscribe owner/repo [feature]
/github unsubscribe owner/repo [feature]
```

These are enabled by default, and can be disabled with the `/github unsubscribe owner/repo [feature]` command:

- `issues` - Opened or closed issues
- `pulls` - New or merged pull requests
- `statuses` - Statuses on pull requests
- `commits` - New commits on the default branch (usually `master`)
- `deployments` - Updated status on deployments
- `public` - A repository switching from private to public

These are disabled by default, and can be enabled with the `/github subscribe owner/repo [feature]` command:

- `reviews` - Pull request reviews
- `comments` - New comments on issues and pull requests
- `branches` - Created or deleted branches
- `branches:tag` - Created tags
- `commits:all` - All commits pushed to any branch

You can subscribe or unsubscribe from multiple settings at once. For example, to turn on activity for pull request reviews and comments:

```
/github subscribe owner/repo reviews comments
```

And to turn it back off:

```
/github unsubscribe owner/repo reviews comments
```

## Questions? Need help?
Please fill out GitHub's [Support form](https://github.com/contact?form%5Bsubject%5D=Re:+GitHub%2BSlack+Integration) and your request will be routed to the right team at GitHub. 

## Contributing
Want to help improve the integration between GitHub and Slack? Check out the [contributing docs](CONTRIBUTING.md) to get involved.

## License
The project is available as open source under the terms of the [MIT License](LICENSE).

When using the GitHub logos, be sure to follow the [GitHub logo guidelines](https://github.com/logos).
