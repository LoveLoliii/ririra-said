import { Injectable, Logger } from '@nestjs/common';
import { AppDateSource } from 'src/config/db.config';
import { BotConfig } from 'src/entity/bot.config';
const processed_msg = new Set();;

@Injectable()
export class ReplyService {
  private bot_config_resitory = AppDateSource.getRepository(BotConfig)
  private readonly logger = new Logger('ReplyService');

  async reply(body:Payload,reply:string): Promise<string> {
    const bot_config = await this.bot_config_resitory.findOne({ where: {} });
    //从数据库查询配置
    if(bot_config){
        let access_token = await fetch_access_token(bot_config.app_id,bot_config.app_secrect)
        const {
        group_openid,
        id: msg_id,
        content,
        } = body.d;
        if (processed_msg.has(msg_id)) {
            this.logger.log(`❗️消息 ${msg_id} 已存在，不重复发送`);
        }
        processed_msg.add(msg_id);
        reply_to_group_at({group_openid,msg_id,msg_type:0,media:null,content:reply,access_token,app_id:bot_config.app_id})
    }else{
        this.logger.error('empty bot config')
    }
    return '';
  }
}



  // 回复被@事件
async function reply_to_group_at({
  group_openid,
  msg_id,
  msg_type,
  media,
  content,
  access_token,
  app_id
}: {
  group_openid: string;
  msg_id: string;
  msg_type: number;
  media: any;
  content: string;
  access_token: string;
  app_id: string;
}) {
  const url = `https://api.sgroup.qq.com/v2/groups/${group_openid}/messages`;

  const data = {
    content,
    msg_type,
    media,
    msg_id: msg_id,
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `QQBot ${access_token}`,
    'X-Union-Appid': app_id,
  };

  try {
    console.log(headers);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const res_data = await res.json();
    if (res.ok) {
      console.log('✅ 回复成功:', res_data);
    } else {
      console.error('❌ 回复失败:', res_data);
    }
  } catch (err: any) {
    console.error('❌ 回复失败:', err.message || err);
  }
}
  
// 获取 accessToken 的方法
async function fetch_access_token(appId: string, clientSecret: string) {
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


