const githubUrl = require('../../github-url');

module.exports = class SubscriptionRequest {
  constructor(
    command,
    {
      gitHubUser, slackUser, slackWorkspace, installation,
    },
    {
      Subscription, LegacySubscription, Channel, Installation,
    },
  ) {
    this.command = command;
    this.gitHubUser = gitHubUser;
    this.installation = installation;
    this.slackUser = slackUser;
    this.slackWorkspace = slackWorkspace;

    this.channel = new Channel(command.channel_id, slackWorkspace);

    this.Subscription = Subscription;
    this.LegacySubscription = LegacySubscription;
    this.Installation = Installation;

    this.resource = githubUrl(this.command.args[0]);
  }

  async getOwnerAndInstallation() {
    return this.Installation.getByUsername(this.resource.owner);

    // if (installation) {
    //   res.locals.installation = installation;
    //   next();
    // } else {
    //   const info = await robot.info();
    //
    //   res.json(new InstallGitHubApp(`${info.html_url}/installations/new/permissions?target_id=${owner.id}`));
    // }
  }

  async getRepository() {
    return (await this.gitHubUser.client.repos.get({
      owner: this.resource.owner,
      repo: this.resource.repo,
    })).data;
  }

  get settings() {
    return this.command.args[1];
  }

  async subscribe() {
    const repository = await this.getRepository();
    const [, installation] = await this.getOwnerAndInstallation();

    const subscription = await this.Subscription.doAllTheShit({
      channel: this.channel,
      creator: this.slackUser,
      repository,
      installation,
      settings: this.settings,
    });

    // FIXME: eager load this when fetching the Subscription
    subscription.repository = repository;
    subscription.SlackWorkspace = this.slackWorkspace;

    await this.LegacySubscription.migrate(subscription);

    return subscription;
  }

  async unsubscribe() {
    const repository = await this.getRepository();

    const subscription = await this.Subscription.lookupOne(
      repository.id,
      this.channel.id,
      this.channel.workspace.id,
    );

    if (!subscription) {
      return;
    }

    subscription.repository = repository;


    if (this.settings) {
      subscription.disable(this.settings);
      await subscription.save();
    } else {
      await subscription.destroy();
    }

    return subscription;
  }
};
