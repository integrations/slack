export interface Field {
  title: string;
  value: string | null;
  short?: boolean;
}

export interface Attachment {
  fallback: string,
  color: string,
  text?: string,
  pretext?: string;
  title?: string;
  title_link?: string;
  fields?: Array<Field>;
  mrkdwn_in?: Array<string>;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  footer?: string;
  footer_icon?: string;
  image_url?: string;
  thumb_url?: string;
  ts?: number;
}
