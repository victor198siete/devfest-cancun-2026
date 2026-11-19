import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller.js';
import { InicioController } from './inicio.controller.js';
import { ReportesModule } from './reportes/reportes.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ReportesModule],
  controllers: [InicioController, HealthController],
})
export class AppModule {}
