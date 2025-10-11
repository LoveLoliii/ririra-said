import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  ririraSaid(): string {
    return '莉莉菈将对你的【罪行】进行审判。\nLilirra shall pass judgment upon your sins.';
  }
}
