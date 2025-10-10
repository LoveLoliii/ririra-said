import { BotConfig } from "src/entity/bot.config";
import { DataSource } from "typeorm";

//可以优化到初始给入
export const AppDateSource = new DataSource({
  type:'mysql',
  host:'__',
  port:3306,
  username:'__',
  password:'__',
  database:'__',
  synchronize:true,
  logging:true,
  entities:  [BotConfig], // 实体类路径
})

AppDateSource.initialize()
  .then(() => {
    console.log('AppDataSource initialized');
  })
  .catch((error) => {
    console.error('AppDataSource initialization failed');
    console.error(error);
  });