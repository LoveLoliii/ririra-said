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