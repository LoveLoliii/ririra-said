import { Injectable } from '@nestjs/common';

@Injectable()
export class ReplyService {
  async reply(body:Payload,reply:string): Promise<string> {
    return 'Hello World!';
  }
}
