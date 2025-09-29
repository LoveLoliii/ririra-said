import { Controller, Post, Body, HttpCode, Res, Get } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import { AppService } from './app.service';
import type { Response } from 'express';
import { lalafellConfig } from './config/all-config';
import nacl from 'tweetnacl';

@Controller()
export class WebhookController {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly appService:AppService
  ) {}

  @Get()
  getHello():string{  
    return this.appService.getHello();
  }

  @Post('callback')
  @HttpCode(200)
  handleWebhook(@Body() body: Payload,@Res() res:Response) {
    const BOT_SECRET = lalafellConfig.secret;
    const { op } = body;
    console.log('接收到的 Payload:', JSON.stringify(body, null, 2));
    const plainToken = body?.d?.plain_token;
    const eventTs = body?.d?.event_ts;
    if (op === 13) {

      // 验证回调地址
      if (!plainToken || !eventTs) {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      // 生成 Ed25519 seed（32字节）通过重复填充 BOT_SECRET
      let seed = BOT_SECRET;
      while (Buffer.from(seed).length < 32) {
        seed += seed;
      }

      // 取前 32 字节
      const seedBuffer = Buffer.from(seed).subarray(0, 32); 
      const keyPair = nacl.sign.keyPair.fromSeed(seedBuffer as Uint8Array);

      // 生成签名字节
      const msg = Buffer.from(eventTs + plainToken, 'utf-8');
      const signatureBytes = nacl.sign.detached(msg as any, keyPair.secretKey);

      // 转 hex 签名
      const signatureHex = Buffer.from(signatureBytes).toString('hex');
      return res.json({
        plain_token: plainToken,
        signature: signatureHex,
      });
    }else{
      this.eventBus.emit('message', {body,res});
    }
  }
}
