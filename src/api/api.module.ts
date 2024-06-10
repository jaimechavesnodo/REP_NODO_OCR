import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { HttpModule } from '@nestjs/axios';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ApiController],
  providers: [
    ApiService,
  ],
})
export class ApiModule {}
