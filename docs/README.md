# GitHub & Slack Integration

## Vision

Slack is "where work happens". GitHub is where software development happens. This integration should inform and drive the conversation about software development happening in Slack, and connect users in Slack to the GitHub ecosystem.

TODO: statement here about using each tool for its strengths

The integration also aims to:

- Maintain functional parity with [legacy integration](https://github.com/github/ecosystem-integrations/blob/master/docs/slack/legacy-features.md), and provide a migration path for existing users.
- Use [GitHub Apps](http://developer.github.com/apps) and [Workspace token-based Slack apps](https://api.slack.com/slack-apps-preview)
- Avoid building significant features into the integration that should be a feature of one of the platforms.

## Roadmap

### :checkered_flag: v1 - Initial Launch

The initial launch of the new Slack integration was focused on preserving functional parity with the legacy integration, and offering an easy migration path for existing users. Because of that constraint, it is mostly a one-way stream of activity from GitHub showing up in Slack. This does _inform_ the conversation about software development happening in Slack, but it does little to _drive_ the conversation or demonstrate the full potential of the GitHub Platform.

### v2 - Q1 2018

The next iteration will be focused on bi-directional integration: preserving the context of conversations that happen in Slack about software on GitHub, enabling developers to interact with GitHub from Slack, and getting work that needs attention in front of the people that can move them forward.

- TODO: specifics here

- Round out notifications and unfurls for GitHub features:  

Feature           | Notifications      | Unfurls           
------------------|--------------------|--------------------
Issues            | :white_check_mark: | :white_check_mark:
Pull Requests     | :white_check_mark: | :white_check_mark:
Comments          | :white_check_mark: | :white_check_mark:
Repository        |                    | :white_check_mark:
Blob              | :no_entry_sign:    | :white_check_mark:
User/Organization | :no_entry_sign:    | :white_check_mark:
Push              | :moon:             | :no_entry_sign:
Public            | :white_check_mark: | :no_entry_sign:
Milestones        | :new_moon:         | :new_moon:
Projects          | :new_moon:         | :new_moon:

Key:
- :white_check_mark: - Done
- :new_moon: - Not Started
- :moon: - In Progress
- :no_entry_sign: - Not Applicable
