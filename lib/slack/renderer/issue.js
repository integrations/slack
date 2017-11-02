const { AbstractIssue } = require('./abstract-issue');
const { arrayToFormattedString } = require('../../helpers');

class Issue extends AbstractIssue {
  constructor(
    constructorObject,
  ) {
    super({
      abstractIssue: constructorObject.issue,
      repository: constructorObject.repository,
      eventType: constructorObject.eventType,
      unfurl: constructorObject.unfurl,
      sender: constructorObject.sender,
    });

    this.issue = constructorObject.issue;
  }
  getFields() {
    // projects should be a field as well, but seems to not be easily available via API?
    if (!this.major) {
      return null;
    }
    const fields = [
      {
        title: 'Assignees',
        value: arrayToFormattedString(this.issue.assignees, 'login'),
      },
      {
        title: 'Labels',
        value: arrayToFormattedString(this.issue.labels, 'name'),
      },
      {
        title: 'Comments',
        value: this.issue.comments,
      },
    ];
    if (this.issue.milestone) {
      fields.push({
        title: 'Milestone',
        value: `<${this.issue.milestone.html_url}|${this.issue.milestone.title}>`,
      });
    }
    return this.constructor.cleanFields(fields);
  }

  getMainAttachment() {
    const attachment = {
      fields: this.getFields(),
      ...this.getBaseMessage(),
    };

    if (!this.unfurl) {
      const preText = this.getPreText('Issue');
      attachment.pretext = preText;
      attachment.fallback = preText;
    }

    // remove any keys where the value is null
    const cleanedAttachment = Object.assign(...Object.keys(attachment)
      .filter(key => attachment[key])
      .map(key => ({ [key]: attachment[key] })));
    return cleanedAttachment;
  }
  getRenderedMessage() {
    return {
      attachments: [
        this.getMainAttachment(),
      ],
    };
  }
}

module.exports = {
  Issue,
};
