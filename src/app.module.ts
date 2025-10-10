import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PluginController } from './plugin.controller';
import { PluginManagerService } from './plugin-manager.service';
import { EventBusService } from './event-bus.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WebhookController } from './webhook.controller';
import { ReplyService } from './reply/reply.service';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController,PluginController,WebhookController],
  providers: [AppService,PluginManagerService,EventBusService,ReplyService],
})
export class AppModule {}
