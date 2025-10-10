import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PluginController } from './plugin.controller.js';
import { PluginManagerService } from './plugin-manager.service.js';
import { EventBusService } from './event-bus.service.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WebhookController } from './webhook.controller.js';
import { ReplyService } from './reply/reply.service.js';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController,PluginController,WebhookController],
  providers: [AppService,PluginManagerService,EventBusService,ReplyService],
})
export class AppModule {}
