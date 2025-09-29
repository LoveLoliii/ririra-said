import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBusService extends EventEmitter2 {
  constructor() {
    super();
  }
}
