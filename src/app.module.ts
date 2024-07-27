import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContractModule } from './contract/contract.module';

@Module({
  imports: [ContractModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
