import { Injectable, Logger } from '@nestjs/common';
import { AppDateSource } from 'src/config/db.config';
import { BotConfig } from 'src/entity/bot.config';

@Injectable()
export class ReplyService {

  private botConfigResitory = AppDateSource.getRepository(BotConfig)
  
  private readonly logger = new Logger('ReplyService');

  async reply(body:Payload,reply:string): Promise<string> {
    const bot_config = await this.botConfigResitory.findOne({ where: {} });
    //从数据库查询配置
    if(bot_config){
        let access_token = await fetchAccessToken(bot_config.app_id,bot_config.app_secrect)
    }else{
        this.logger.error('empty bot config')
    }
    
    return '';
  }
}


// 获取 accessToken 的方法
async function fetchAccessToken(appId: string, clientSecret: string) {
  try {
    const response = await fetch('https://bots.qq.com/app/getAppAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appId,
        clientSecret
      })
    });

    const data = await response.json();

    if (data && data.access_token) {
      console.log('获取 accessToken 成功:', data);
      return data.access_token;
    } else {
      console.error('获取 accessToken 失败，响应异常:', data);
      throw new Error('无效的 accessToken 响应');
    }
  } catch (error) {
    console.error('获取 accessToken 出错:', error);
    throw error;
  }
}
