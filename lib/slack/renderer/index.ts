interface ConstructorObject {
  includeFooter: boolean;
  footerURL?: string;
  includeAuthor?: true; // take my question mark away
  author?: {
    login: string;
    avatarURL: string,
    htmlURL: string,
  }
}
export interface Field {
  title: string;
  value: string | null;
}
export interface Attachment {
  color: string;
  footer?: string;
  footer_icon?: string;
  author_name?: string;
  author_icon?: string;
  author_link?: string;
}

interface Constants {
  GITHUB_BLACK: string;
  CLOSED_RED: string;
  OPEN_GREEN: string;
  MERGED_PURPLE: string;
  STATUS_SUCCESS: string;
  STATUS_PENDING: string;
  STATUS_FAILURE: string;
  BASE_ATTACHMENT_COLOR: string;
  ATTACHMENT_FIELD_LIMIT: number,
  MAJOR_MESSAGES: {
    [key: string]: boolean;
  }
}

export const constants: Constants = {
  GITHUB_BLACK: '#24292f',
  CLOSED_RED: '#cb2431',
  OPEN_GREEN: '#36a64f',
  MERGED_PURPLE: '#6f42c1',
  STATUS_SUCCESS: '#28a745',
  STATUS_PENDING: '#dbab09',
  STATUS_FAILURE: '#cb2431',
  BASE_ATTACHMENT_COLOR: '#24292f',
  ATTACHMENT_FIELD_LIMIT: 2,
  MAJOR_MESSAGES: {
    'pull_request.opened': true,
    'issues.opened': true,
  },
};
export class Message {
  includeFooter: boolean;
  footerURL: string;
  includeAuthor: true;
  author: {
    login: string;
    avatarURL: string,
    htmlURL: string,
  }
  constructor(constructorObject: ConstructorObject) {
    this.includeFooter = constructorObject.includeFooter;
    this.footerURL = constructorObject.footerURL;
    this.includeAuthor = constructorObject.includeAuthor;
    this.author = constructorObject.author;
  }

  static cleanFields(
    fields: Array<Field>,
    fieldLimit: number = constants.ATTACHMENT_FIELD_LIMIT,
    short: boolean = true,
  ) {
    return fields
      .filter(field => field.value)
      .map((field) => {
        if (short) {
          return { ...field, short: true };
        }
        return { ...field };
      })
      .slice(0, fieldLimit);
  }

  getBaseMessage(): Attachment {
    const baseMessage: Attachment = {
      color: constants.GITHUB_BLACK,
    };
    if (this.includeFooter) {
      baseMessage.footer = `<${this.footerURL}|View it on GitHub>`;
      baseMessage.footer_icon = 'https://assets-cdn.github.com/favicon.ico';
    }
    if (this.includeAuthor) {
      baseMessage.author_name = this.author.login;
      baseMessage.author_icon = this.author.avatarURL;
      baseMessage.author_link = this.author.htmlURL;
    }
    return baseMessage;
  }

}
