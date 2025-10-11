import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface BotEventContext<TPayload = any> {
  event: string;
  payload: TPayload;
  reply: (msg: string) => Promise<void>;
  shared: Map<string, any>;
}

@Injectable()
export class EventBusService {
  private readonly logger = new Logger('EventBus');
  private readonly shared = new Map<string, any>();
  private readonly pluginPermissions = new Map<string, Set<string>>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /** 插件注册事件监听 */
  on(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.on(event, listener);
  }
  /**
   * 广播事件给已注册插件
   */
  async emit(event: string, context: BotEventContext): Promise<any[]> {
    this.logger.debug(`广播事件: ${event}`);
    
    const listeners = this.eventEmitter.listeners(event);
    const allowed = listeners.filter((fn: any) => {
      const pluginName = fn.__pluginName;
      return !pluginName || this.hasPermission(pluginName, event);
    });

    return await Promise.all(allowed.map(fn => fn(context)));
  }

  /**
   * 注册插件声明的事件监听权限
   * @param pluginName 插件名称
   * @param events 插件可监听的事件名数组
   */
  registerPermission(pluginName: string, events: string[]): void {
    if (!events || events.length === 0) return;

    const set = new Set(events);
    this.pluginPermissions.set(pluginName, set);
    this.logger.log(`插件 [${pluginName}] 注册了事件监听权限: ${[...set].join(', ')}`);
  }

  /**
   * 检查插件是否有权限监听某事件
   */
  hasPermission(pluginName: string, event: string): boolean {
    const set = this.pluginPermissions.get(pluginName);
    return !!set?.has(event);
  }

  /**
   * 移除插件的事件权限（卸载时调用）
   */
  unregisterPlugin(pluginName: string): void {
    this.pluginPermissions.delete(pluginName);
    this.logger.log(`插件 [${pluginName}] 已注销`);
  }

  /**
   * 插件间共享上下文
   */
  getShared<T = any>(key: string): T | undefined {
    return this.shared.get(key);
  }

  setShared(key: string, value: any): void {
    this.shared.set(key, value);
  }
}