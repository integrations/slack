module.exports = class SubscriptionRequest {
  constructor(
    command,
    {
      resource, gitHubUser, slackUser, slackWorkspace, installation,
    },
    { Subscription, LegacySubscription, Channel },
  ) {
    this.command = command;
    this.resource = resource;
    this.gitHubUser = gitHubUser;
    this.installation = installation;
    this.slackUser = slackUser;
    this.slackWorkspace = slackWorkspace;

    this.channel = new Channel(command.channel_id, slackWorkspace);

    this.Subscription = Subscription;
    this.LegacySubscription = LegacySubscription;
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

    const subscription = await this.Subscription.doAllTheShit({
      channel: this.channel,
      creator: this.slackUser,
      repository,
      installation: this.installation,
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
