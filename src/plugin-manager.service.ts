// plugin-manager.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { EventBusService } from './event-bus.service';

@Injectable()
export class PluginManagerService {
  private readonly pluginDir = path.join(process.cwd(), 'plugins');
  private readonly loadedPlugins = new Map<string, any>();

  constructor(private readonly eventBus: EventBusService) {
    if (!fs.existsSync(this.pluginDir)) {
      fs.mkdirSync(this.pluginDir, { recursive: true });
    }
  }

  /** 安装插件并加载 */
  async install(url: string, name?: string) {
    const pluginName = name || path.basename(url);
    const filePath = path.join(this.pluginDir, pluginName);

    // 🔄 用 fetch 下载插件代码
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download plugin: ${response.status} ${response.statusText}`);
    }
    const code = await response.text();
    fs.writeFileSync(filePath, code, 'utf-8');

    // 动态加载
    this.load(pluginName);

    return { pluginName, filePath };
  }

  /** 卸载插件 */
  async uninstall(name: string) {
    this.unload(name);
    const filePath = path.join(this.pluginDir, name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /** 动态加载插件 */
  load(name: string) {
    const filePath = path.join(this.pluginDir, name);
    if (!fs.existsSync(filePath)) throw new Error(`Plugin file not found: ${filePath}`);

    // 清理 require 缓存，确保可以热更新
    delete require.cache[require.resolve(filePath)];

    const pluginModule = require(filePath);
    if (pluginModule.init) {
      pluginModule.init(this.eventBus);
    }

    this.loadedPlugins.set(name, pluginModule);
    console.log(`[PluginManager] Loaded plugin: ${name}`);
  }

  /** 卸载已加载插件 */
  unload(name: string) {
    if (this.loadedPlugins.has(name)) {
      this.loadedPlugins.delete(name);
      console.log(`[PluginManager] Unloaded plugin: ${name}`);
    }
  }
}
