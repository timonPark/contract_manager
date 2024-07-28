import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContractModule } from './contract/contract.module';
import * as path from 'path';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    ContractModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  public static CHROMIUM_EXECUTABLE_PATH = path.join(
    __dirname,
    '..',
    'chromium',
    'chrome',
    'chrome-headless-shell',
  );
}
