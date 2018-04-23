# GitHub and Slack integration: Vision and Priorities

Slack is "where work happens". GitHub is where software development happens. This integration should inform and drive the conversation about software development happening in Slack, and connect users in Slack to the GitHub ecosystem.

The integration should also embrace these constraints:

- Use only public platform features offered through [GitHub Apps](http://developer.github.com/apps) and [Workspace token-based Slack apps](https://api.slack.com/slack-apps-preview)
- Avoid building significant features into the integration that should be a feature of one of the platforms.

## Priorities and upcoming themes

### :checkered_flag: Initial Launch

The initial launch of the new Slack integration was focused on preserving functional parity with the [legacy integration](https://github.com/github/ecosystem-integrations/blob/master/docs/slack/legacy-features.md), and offering an easy migration path for existing users. Because of that constraint, it is mostly a one-way stream of activity from GitHub showing up in Slack, with notifications for activity happening on GitHub, and unfurls of GitHub links shared in Slack discussions. 

### :soon: Comprehensive coverage for unfurls and notifications

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

### :pushpin: Bi-directional engagement

Following comprehensive feature parity, we hope to make the integration more interactive and bi-directional. By bringing more of the GitHub experience into Slack and vice versa, we believe we can reduce context switching for developers and make the conversations around software development more engaging.

Some features within this theme could include:
- Interactive with messages in Slack, e.g. "Merge a Pull Request"
- Open an Issue from Slack using Forms
- Slash commands for GitHub actions, e.g. `/close <issue>`

### :pushpin: Making software teams more efficient

Building on top of a more engaging bi-directional experience, we hope to focus on features to make software development teams more efficient given by bringing insights and team project management features into Slack.

Some features within this theme could include:
- A slash command to list all of the new issues your team has been mentioned in
- Reminders and management of team review requests
- Notifications for and integration with team discussions

### :pushpin: Making software developers more efficient

Following team efficiency, we'd like to extend into features focused on individual developers. We can use the integration to help answer questions like "what should I work on next?" and ensure that the right work gets put in front of the folks most empowered to move software projects forward.

Some features within this theme could include:
- Messages when issues are assigned to you
- Personal notifications for work that is blocking other people
- Updates on the status of your Pull Request reviews

### :pushpin: GitHub Enterprise & Slack Enterprise Grid Support

Finally, we hope to focus on bringing these features to the environments of the largest customers of both platforms.

---

#### Note about upcoming themes

As with any software project, the :point_up: upcoming themes are subject to change, and the provided examples are intended to illustrate where we hope to go.
