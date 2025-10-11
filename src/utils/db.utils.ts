import { AppDataSource } from '../config/db.config.js';
import { DataSource, EntityTarget } from 'typeorm';



/**
 * 确保某个实体对应的表存在，不存在则自动创建
 */
export async function ensureTableExists(
  dataSource: DataSource,
  entityClass: EntityTarget<any>
): Promise<void> {
  addEntitiesAndReload([entityClass])
}

// 动态添加实体
function addEntitiesAndReload(newEntities: any[]) {
  let newAS = AppDataSource;
  let entities = AppDataSource.options.entities as EntityTarget<any>[]
  newAS = new DataSource({
    ...AppDataSource.options,
    entities: [...entities, ...newEntities],
  });

  return newAS.initialize(); // 重新初始化
}

export async function registerPluginEntities(plugin) {
  if (!plugin.entities?.length) return;
  let entities = AppDataSource.options.entities as EntityTarget<any>[]
  // 追加到 DataSource 配置
  const newEntities = plugin.entities.filter(
    e => !entities.includes(e)
  );

  if (newEntities.length > 0) {
    AppDataSource.setOptions({
      ...AppDataSource.options,
      entities: [...entities, ...newEntities],
    });

    // ⚠️ TypeORM 0.3.x 必须重新初始化 DataSource 才能识别新实体
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    await AppDataSource.initialize();

    console.log(`[typeorm] 已注册实体: ${newEntities.map(e => e.name).join(', ')}`);
  }
}