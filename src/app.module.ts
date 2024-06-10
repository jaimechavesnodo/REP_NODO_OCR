import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiModule } from './api/api.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ApiModule,
    CommonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
