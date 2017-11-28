class Router {
  constructor(model) {
    this.model = model;
  }

  async lookup(githubId) {
    return (await this.model.findAll({ where: { githubId } }))
      .map(subscription => subscription.channelId);
  }

  async subscribe(githubId, channelId) {
    await this.model.findOrCreate({ where: { githubId, channelId } });
  }

  async unsubscribe(githubId, channelId) {
    await this.model.destroy({ where: { githubId, channelId } });
  }
}

module.exports = Router;
