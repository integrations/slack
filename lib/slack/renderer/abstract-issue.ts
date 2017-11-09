import moment from 'moment';

import {
  constants,
  Message,
  Attachment
} from './index';

interface AbstractIssueDefinition {
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
  merged?: boolean;
}

interface Sender {
  login: string;
}

export interface RepositoryDefinition {
  full_name: string;
}

interface Core {
  text?: string;
  title: string;
  title_link: string,
  fallback: string,
}

export class AbstractIssue extends Message {
  private createdAt: moment.Moment;
  protected major: boolean;
  constructor(
      private abstractIssue: AbstractIssueDefinition,
      protected repository: RepositoryDefinition,
      protected eventType: string,
      protected unfurl?: boolean,
      protected sender?: Sender,
  ) {
    super({
      includeFooter: true,
      footerURL: abstractIssue.html_url,
    });

    this.createdAt = moment(this.abstractIssue.created_at);

    if (constants.MAJOR_MESSAGES[this.eventType] || this.unfurl) {
      this.major = true;
    }
  }

  static getHexColorbyState(state: string, merged: boolean = false): string {
    if (state === 'open') {
      return constants.OPEN_GREEN;
    } else if (state === 'closed' && merged === false) {
      return constants.CLOSED_RED;
    } else if (state === 'closed' && merged === true) {
      return constants.MERGED_PURPLE;
    }
  }

  getAuthor() {
    return {
      author_name: this.abstractIssue.user.login,
      author_link: this.abstractIssue.user.html_url,
      author_icon: this.abstractIssue.user.avatar_url,
    };
  }

  getPreText(subject: string, merged: boolean = false) {
    let predicate;
    let actor;
    if (merged) {
      predicate = 'merged';
    } else {
      const predicateRe = /\w+\.(\w+)/g; // e.g. match 'opened' for 'issues.opened'
      predicate = predicateRe.exec(this.eventType)[1];
    }
    if (this.sender) {
      actor = this.sender.login;
    } else {
      actor = this.abstractIssue.user.login;
    }
    return `[${this.repository.full_name}] ${subject} ${predicate} by ${actor}`;
  }

  getCore(): Core {
    // TODO: Need to convert markdown in body to Slack markdown
    const text = this.abstractIssue.body;
    const title = `#${this.abstractIssue.number} ${this.abstractIssue.title}`;
    // eslint-disable-next-line camelcase
    const title_link = this.abstractIssue.html_url;
    const core: Core = {
      title,
      title_link,
      fallback: title,
    };
    if (this.major) {
      core.text = text;
    }
    return core;
  }

  getBaseMessage() {
    return {
      ...super.getBaseMessage(),
      color: AbstractIssue.getHexColorbyState(
        this.abstractIssue.state,
        this.abstractIssue.merged,
      ),
      ts: this.createdAt.unix(),
      mrkdwn_in: ['text'],
      ...this.getAuthor(),
      ...this.getCore(),
    };
  }
}
