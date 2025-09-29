import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PluginController } from './plugin.controller';
import { PluginManagerService } from './plugin-manager.service';
import { EventBusService } from './event-bus.service';

@Module({
  imports: [],
  controllers: [AppController,PluginController],
  providers: [AppService,PluginManagerService,EventBusService],
})
export class AppModule {}
