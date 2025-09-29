// plugin.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { PluginManagerService } from './plugin-manager.service';

@Controller('plugin')
export class PluginController {
  constructor(private readonly pluginManager: PluginManagerService) {}

  @Post('install')
  async install(@Body('url') url: string) {
    const result = await this.pluginManager.install(url);
    return { message: `Plugin installed from ${url}`, ...result };
  }

  @Post('uninstall')
  async uninstall(@Body('name') name: string) {
    await this.pluginManager.uninstall(name);
    return { message: `Plugin ${name} uninstalled` };
  }
}
