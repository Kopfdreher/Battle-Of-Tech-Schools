import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { VerifyModule } from './verify/verify.module.js';

@Module({
  imports: [VerifyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
