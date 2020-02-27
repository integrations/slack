const { Message, constants } = require('.');

module.exports = class SearchResult extends Message {
  constructor(items, resource) {
    super({});
    this.items = items;
    this.resource = resource;
  }

  toJSON() {
    if (!this.items || this.items.length === 0) {
      return {
        text: `No search results found for \`${this.resource.owner}/${this.resource.repo}\``,
      };
    }
    const { owner, repo } = this.resource;
    return {
      attachments: this.items
        .map(item => ({
          fallback: `[${owner}/${repo}] ${item.path}`,
          title: item.name,
          title_link: item.html_url,
          footer: `${owner}/${repo}`,
          footer_icon: constants.FOOTER_ICON,
          text: item.html_url,
        })),
    };
  }
};
