import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('ririra said:', () => {
      expect(appController.ririraSaid()).toBe('莉莉菈将对你的【罪行】进行审判。\nLilirra shall pass judgment upon your sins.');
    });
  });
});
