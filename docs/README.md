# GitHub and Slack integration: Vision and Priorities

Slack is "where work happens". GitHub is where software development happens. This integration should inform and drive the conversation about software development happening in Slack, and connect users in Slack to the GitHub ecosystem.

TODO: statement here about using each tool for its strengths

The integration should also embrace these constraints:

- Use only public platform features offered through [GitHub Apps](http://developer.github.com/apps) and [Workspace token-based Slack apps](https://api.slack.com/slack-apps-preview)
- Avoid building significant features into the integration that should be a feature of one of the platforms.

## Priorities

### :checkered_flag: Initial Launch

The initial launch of the new Slack integration was focused on preserving functional parity with the [legacy integration](https://github.com/github/ecosystem-integrations/blob/master/docs/slack/legacy-features.md), and offering an easy migration path for existing users. Because of that constraint, it is mostly a one-way stream of activity from GitHub showing up in Slack, with notifications for activity happening on GitHub, and unfurls of GitHub links shared in Slack discussions. 

### Comprehensive coverage for unfurls and notifications

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

### Bi-directional engagement

### Making software teams more efficient

.sup
team review requests
Notifcations for team discussion

### Making software developers more efficient

Assigned to you
Personal notifications for work that is blocking other people
Your PR was reviewed

### GitHub Enterprise & Slack Enterprise Grid Support
