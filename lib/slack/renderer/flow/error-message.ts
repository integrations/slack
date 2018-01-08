import { Message } from "../../renderer";

interface IAction {
  [index: string]: string;
}
interface IAttachment {
  actions?: IAction[];
  [index: string]: string | string[] | IAction[] | undefined;
}
interface IResponse {
  response_type?: string;
  attachments: IAttachment[];
}

export default class ErrorMessage extends Message {
  constructor() {
    super({});
  }

  public getErrorMessage(): IResponse {
    return {
      attachments: [{
        ...this.getBaseMessage(),
        color: "danger",
        mrkdwn_in: ["text"],
      }],
      response_type: "ephemeral",
    };
  }
}
