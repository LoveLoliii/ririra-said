import { Controller, Post, Body } from '@nestjs/common';
import { EventBusService } from './event-bus.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly eventBus: EventBusService) {}

  @Post()
  async handleWebhook(@Body() body: any) {
    console.log('📩 Received Event:', body);

    // 假设是消息事件
    if (body.t === 'MESSAGE_CREATE') {
      this.eventBus.emit('message', body);
    }

    return { type: 5 }; // ACK
  }
}
