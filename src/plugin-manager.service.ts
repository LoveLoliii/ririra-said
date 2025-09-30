import { Injectable } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import AdmZip from 'adm-zip';
import { exec, spawn } from 'child_process';
import * as tar from 'tar';
import { createRequire } from 'module';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class PluginManagerService {
  private plugins = new Map<string, any>();
  private pluginsDir = path.join(process.cwd(), 'plugins');

  constructor(private readonly eventBus: EventBusService) {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }


async loadAllPlugins() {
  const pluginDirs = fs.readdirSync(this.pluginsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const dir of pluginDirs) {
    try {
      const meta = this.readPluginMeta(path.join(this.pluginsDir, dir));
      if (meta.enabled) {
        await this.loadPlugin(dir, meta);
      }
    } catch (err) {
      console.error(`❌ 加载插件 ${dir} 失败:`, err.message);
    }
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
      console.log(`[PluginManager] 下载 zip 插件 ${name}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`下载失败: ${res.statusText}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const zip = new AdmZip(buf);
      zip.extractAllTo(pluginPath, true);
    } else if (url.endsWith('.tgz')) {
      console.log(`[PluginManager] 下载 tgz 插件 ${name}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`下载失败: ${res.statusText}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const tarPath = path.join(this.pluginsDir, `${name}.tgz`);
      fs.writeFileSync(tarPath, buf);
      await tar.x({ file: tarPath, cwd: pluginPath });
      fs.unlinkSync(tarPath);
    } else if (url.endsWith('.git')) {
      console.log(`[PluginManager] git clone 插件 ${name}`);
      await execAsync(`git clone ${url} ${pluginPath}`, { cwd: this.pluginsDir });
    } else {
      throw new Error('暂不支持的插件格式（只支持 zip/tgz/git）');
    }

    // 自动 npm install 插件依赖
    const pkgJson = path.join(pluginPath, 'package.json');
    if (fs.existsSync(pkgJson)) {
      console.log(`[PluginManager] 安装插件依赖 ${name}`);
      await this.runNpmInstall(pluginPath);
    }

    // 加载插件
    const meta = this.readPluginMeta(pluginPath)
    if(meta.enabled){
      await this.loadPlugin(name,meta);
    }
    
  }

  /** 卸载插件 */
  async uninstallPlugin(name: string) {
    this.unloadPlugin(name);
    const pluginPath = path.join(this.pluginsDir, name);
    fs.rmSync(pluginPath, { recursive: true, force: true });
    console.log(`[PluginManager] 插件 ${name} 已卸载`);
  }

/** 加载插件（支持热重载） */
async loadPlugin(name: string,meta:any) {
  const pluginPath = path.join(this.pluginsDir, name,meta.main);
  if (!fs.existsSync(pluginPath)) throw new Error(`插件入口不存在: ${pluginPath}`);

  this.unloadPlugin(name);

  // 清理 require 缓存
  Object.keys(require.cache).forEach((k) => {
    if (k.startsWith(path.join(this.pluginsDir, name))) {
      delete require.cache[k];
    }
  });

  // 使用插件自己的 require
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

/** 执行 npm install，优先使用主框架已有依赖 */
private async runNpmInstall(pluginPath: string): Promise<void> {
  const pkgPath = path.join(pluginPath, 'package.json');
  if (!fs.existsSync(pkgPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = pkg.dependencies ? Object.entries(pkg.dependencies) : [];

  if (deps.length === 0) return;

  // 读取主框架 package.json
  const rootPkgPath = path.join(process.cwd(), 'package.json');
  const rootPkg = fs.existsSync(rootPkgPath) ? JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8')) : {};
  const rootDeps = { ...(rootPkg.dependencies || {}), ...(rootPkg.devDependencies || {}) };

  // 过滤掉已存在依赖
  const toInstall = deps.filter(([name]) => !rootDeps[name]);
  if (toInstall.length === 0) return;

  // npm install 只安装剩下的依赖到插件目录
  return new Promise((resolve, reject) => {
    const args = ['install', '--production', ...toInstall.map(([n, v]) => `${n}@${v}`)];
    const npm = spawn('npm', args, {
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





  private readPluginMeta(pluginPath: string) {
  const pkgPath = path.join(pluginPath, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`插件缺少 package.json: ${pluginPath}`);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (!pkg.name || !pkg.version) {
    throw new Error(`插件 package.json 缺少 name 或 version`);
  }

  return {
    name: pkg.name,
    version: pkg.version,
    enabled: pkg.enabled ?? true,
    main: pkg.main ?? 'index.js',
    source: pkg.source ?? null,
    dependencies: pkg.dependencies ?? {}
  };
}

}

