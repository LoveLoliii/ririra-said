import { Injectable } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import AdmZip from 'adm-zip';
import { spawn } from 'child_process';
import { createRequire } from 'module';

@Injectable()
export class PluginManagerService {
  private plugins = new Map<string, any>();
  private pluginsDir = path.join(process.cwd(), 'plugins');

  constructor(private readonly eventBus: EventBusService) {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  /** 安装插件：下载 + 解压 + npm install */
  async installPlugin(name: string, url: string) {
    console.log(`[PluginManager] 下载插件 ${name} from ${url}`);

    const pluginPath = path.join(this.pluginsDir, name);
    if (!fs.existsSync(pluginPath)) fs.mkdirSync(pluginPath, { recursive: true });

    const res = await fetch(url);
    if (!res.ok) throw new Error(`下载失败: ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());

    if (url.endsWith('.zip')) {
      const zip = new AdmZip(buf);
      zip.extractAllTo(pluginPath, true);
    } else if (url.endsWith('.js')) {
      fs.writeFileSync(path.join(pluginPath, 'index.js'), buf);
    } else {
      throw new Error('暂不支持的插件格式');
    }

    // 自动 npm install 插件依赖
    const pkgJson = path.join(pluginPath, 'package.json');
    if (fs.existsSync(pkgJson)) {
      console.log(`[PluginManager] 安装插件依赖 ${name}`);
      await this.runNpmInstall(pluginPath);
    }

    // 加载插件
    await this.loadPlugin(name);
  }

  /** 卸载插件 */
  async uninstallPlugin(name: string) {
    this.unloadPlugin(name);
    const pluginPath = path.join(this.pluginsDir, name);
    fs.rmSync(pluginPath, { recursive: true, force: true });
    console.log(`[PluginManager] 插件 ${name} 已卸载`);
  }

  /** 加载插件（独立依赖） */
  async loadPlugin(name: string) {
    const pluginPath = path.join(this.pluginsDir, name, 'index.js');
    if (!fs.existsSync(pluginPath)) throw new Error(`插件入口不存在: ${pluginPath}`);

    this.unloadPlugin(name);

    // 使用 createRequire 指向插件目录的 node_modules
    const pluginRequire = createRequire(pluginPath);
    const pluginModule = pluginRequire(pluginPath);

    const plugin = pluginModule.default || pluginModule;
    this.plugins.set(name, plugin);

    if (typeof plugin.init === 'function') {
      plugin.init(this.eventBus);
    }
    console.log(`[PluginManager] 插件 ${name} 已加载`);
  }

  /** 卸载插件 */
  unloadPlugin(name: string) {
    const plugin = this.plugins.get(name);
    if (plugin && typeof plugin.destroy === 'function') {
      plugin.destroy();
    }
    this.plugins.delete(name);
    console.log(`[PluginManager] 插件 ${name} 已卸载`);
  }

  /** 执行 npm install */
  private runNpmInstall(pluginPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install', '--production'], {
        cwd: pluginPath,
        stdio: 'inherit',
        shell: true,
      });
      npm.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`npm install failed for ${pluginPath}, code=${code}`));
      });
    });
  }
}
