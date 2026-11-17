import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { GeminiService } from '../gemini/gemini.service.js';
import { ReportesController } from './reportes.controller.js';
import { ReportesService } from './reportes.service.js';

@Module({
  imports: [
    // Límite por IP, solo se aplica donde se usa ThrottlerGuard (POST /reportes)
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ ttl: 60_000, limit: Number(config.get('LIMITE_POR_MINUTO') ?? 20) }],
        errorMessage: 'Demasiados reportes seguidos, espera un minuto',
      }),
    }),
  ],
  controllers: [ReportesController],
  providers: [ReportesService, GeminiService],
})
export class ReportesModule {}
