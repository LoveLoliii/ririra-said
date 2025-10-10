import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PluginManagerService } from './plugin-manager.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

// 获取 PluginManagerService 实例
  const pluginManager = app.get(PluginManagerService);

  // 启动时加载所有已下载的插件
  try {
    await pluginManager.init();
    console.log('✅ 所有插件已加载完成');
  } catch (err) {
    console.error('❌ 加载插件失败:', err);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
