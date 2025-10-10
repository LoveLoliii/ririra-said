import { Controller, Post, Delete, Body } from '@nestjs/common';
import { PluginManagerService } from './plugin-manager.service.js';

@Controller('plugin')
export class PluginController {
  constructor(private readonly pluginManager: PluginManagerService) {}

  @Post('install')
  async install(@Body() body: { name: string; url: string }) {
    await this.pluginManager.installPlugin(body.name, body.url);
    return { message: `插件 ${body.name} 安装成功` };
  }

  @Delete('uninstall')
  async uninstall(@Body('name') name: string) {
    await this.pluginManager.unloadPlugin(name);
    return { message: `插件 ${name} 卸载成功` };
  }
}
