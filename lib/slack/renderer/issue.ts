import { AbstractIssue, RepositoryDefinition } from './abstract-issue';
import { Attachment, Field } from './types';
import { arrayToFormattedString } from '../../helpers';

interface Assignee {
  login: string;
}

interface Label {
  name: string;
}

interface IssueDefinition {
  html_url: string;
  created_at: string;
  user: {
    login: string,
    avatar_url: string,
    html_url: string,
  }
  body: string;
  number: number;
  title: string;
  state: string;
  assignees: Array<Assignee>;
  labels: Array<Label>;
  comments: number;
  milestone: {
    title: string;
    html_url: string;
  }
}
interface Sender {
  login: string;
}

interface IssueAttachment extends Attachment {
  text?: string;
  pretext?: string;
  fallback: string;
  title: string;
  fields: Array<Field>;
  [key: string]: any;
}

export class Issue extends AbstractIssue {
  constructor(
    private issue: IssueDefinition,
    repository: RepositoryDefinition,
    eventType: string,
    unfurl?: boolean,
    sender?: Sender,
  ) {
    super(
      issue,
      repository,
      eventType,
      unfurl,
      sender,
    );

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
        value: this.issue.comments.toString(),
      },
    ];
    if (this.issue.milestone) {
      fields.push({
        title: 'Milestone',
        value: `<${this.issue.milestone.html_url}|${this.issue.milestone.title}>`,
      });
    }
    return Issue.cleanFields(fields);
  }

  getMainAttachment(): IssueAttachment {
    const attachment: IssueAttachment = {
      fields: this.getFields(),
      ...this.getBaseMessage(),
    };

    if (!this.unfurl) {
      const preText = this.getPreText('Issue');
      attachment.pretext = preText;
      attachment.fallback = preText;
    }

    // remove any keys where the value is null
    const cleanedAttachment: IssueAttachment = Object.assign(...Object.keys(attachment)
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
