import { Module } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service.js';
import { ReportesController } from './reportes.controller.js';
import { ReportesService } from './reportes.service.js';

@Module({
  controllers: [ReportesController],
  providers: [ReportesService, GeminiService],
})
export class ReportesModule {}
