import { Module } from '@nestjs/common';
import { VerifyController } from './verify.controller.js';
import { VerifyService } from './verify.service.js';

@Module({
  controllers: [VerifyController],
  providers: [VerifyService],
})
export class VerifyModule {}
