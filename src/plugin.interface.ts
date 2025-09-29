export interface BotPlugin {
  name: string;
  version: string;
  onMessage?(event: any, ctx: PluginContext): Promise<void>;
}

export interface PluginContext {
  sendMessage(channelId: string, content: string): Promise<void>;
}
