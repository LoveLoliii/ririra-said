import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from './event-bus.service.js';
import { AppDataSource } from './config/db.config.js';
import fs from 'fs';
import path from 'path';
import { x as tarX } from 'tar'; // 使用命名导入
import AdmZip from 'adm-zip';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ensureTableExists } from './utils/db.utils.js';

const execAsync = promisify(exec);

@Injectable()
export class PluginManagerService {
  private readonly logger = new Logger('PluginManager');
  private plugins = new Map<string, any>();
  private pluginsDir = path.join(process.cwd(), 'plugins');

  constructor(private readonly eventBus: EventBusService) {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  /** 启动时加载已下载插件 */
  async init() {
    const dirs = fs.readdirSync(this.pluginsDir);
    for (const name of dirs) {
      const pluginPath = path.join(this.pluginsDir, name);
      const pkgPath = path.join(pluginPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const meta = this.readPluginMeta(pluginPath);
        if (meta.enabled) {
          await this.loadPlugin(meta.name, meta);
        }
      }
    }
  }

  /** 下载 + 解压 + npm install */
  async installPlugin(name: string, url: string) {
    this.logger.log(`下载插件 ${name} from ${url}`);

    const pluginPath = path.join(this.pluginsDir, name);
    if (!fs.existsSync(pluginPath)) fs.mkdirSync(pluginPath, { recursive: true });

    const res = await fetch(url);
    if (!res.ok) throw new Error(`下载失败: ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());

    if (url.endsWith('.zip')) {
      const zip = new AdmZip(buf);
      zip.extractAllTo(pluginPath, true);
    } else if (url.endsWith('.tgz')) {
      const tarPath = path.join(this.pluginsDir, `${name}.tgz`);
      fs.writeFileSync(tarPath, buf);
      await tarX({ file: tarPath, cwd: pluginPath }); // 使用命名导入的 tarX 函数
      fs.unlinkSync(tarPath);
    } else if (url.endsWith('.git')) {
      await execAsync(`git clone ${url} ${pluginPath}`, { cwd: this.pluginsDir });
    } else {
      throw new Error('暂不支持的插件格式（zip/tgz/git）');
    }

    const pkgJson = path.join(pluginPath, 'package.json');
    if (fs.existsSync(pkgJson)) {
      this.logger.log(`安装插件依赖 ${name}`);
      await this.runNpmInstall(pluginPath);
    }

    const meta = this.readPluginMeta(pluginPath);
    if (meta.enabled) {
      await this.loadPlugin(name, meta);
    }
  }

  /** 加载插件（带事件总线注入） */
  async loadPlugin(name: string, meta: any) {
    const entryPath = path.join(this.pluginsDir, name, meta.main);
    if (!fs.existsSync(entryPath)) throw new Error(`插件入口不存在: ${entryPath}`);

    this.unloadPlugin(name);

    // 动态 import 加载插件
    const fileUrl = `file://${entryPath}`;
    const pluginModule = await import(fileUrl);
    const plugin = pluginModule.default || pluginModule;

    this.plugins.set(name, plugin);
    this.eventBus.registerPermission(name, Object.keys(meta.events ?? {}));

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    const db = {
      query: async (sql, params) => AppDataSource.query(sql, params),
      getRepository: (entity) => AppDataSource.getRepository(entity),
    };
    if (typeof plugin.init === 'function') {
      if(plugin.entities){
        for (const entity of plugin.entities) {
        await ensureTableExists(AppDataSource, entity);
        }
      }
      plugin.init(this.eventBus, db);
    }

    this.logger.log(`插件 ${name}@${meta.version} 已加载`);
  }

  unloadPlugin(name: string) {
    const plugin = this.plugins.get(name);
    if (plugin?.destroy) plugin.destroy();
    this.plugins.delete(name);
    this.logger.log(`插件 ${name} 已卸载`);
  }

  /** 优先使用主依赖的 npm install */
  private async runNpmInstall(pluginPath: string) {
    const rootNodeModules = path.join(process.cwd(), 'node_modules');
    const pluginNodeModules = path.join(pluginPath, 'node_modules');

    await execAsync(`npm install --production --no-audit`, {
      cwd: pluginPath,
      env: {
        ...process.env,
        NODE_PATH: `${rootNodeModules}${path.delimiter}${pluginNodeModules}`,
      },
    });
  }

  private readPluginMeta(pluginPath: string) {
    const pkgPath = path.join(pluginPath, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!pkg.name || !pkg.version) throw new Error(`插件缺少 name/version`);

    return {
      name: pkg.name,
      version: pkg.version,
      enabled: pkg.enabled ?? true,
      main: pkg.main ?? 'index.js',
      events: pkg.events ?? {},
    };
  }
}