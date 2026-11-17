import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CrearReporteDto } from './dto/crear-reporte.dto.js';
import { ReporteRespuestaDto } from './dto/reporte-respuesta.dto.js';
import { ReportesService } from './reportes.service.js';

@ApiTags('Reportes')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Analiza la foto de una mascota y devuelve un reporte estructurado' })
  @ApiResponse({ status: 201, description: 'Reporte generado', type: ReporteRespuestaDto })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 429, description: 'Demasiados reportes seguidos desde la misma IP' })
  @ApiResponse({ status: 502, description: 'Gemini devolvió una respuesta inválida' })
  @ApiResponse({ status: 503, description: 'Gemini está ocupado' })
  crear(@Body() dto: CrearReporteDto): Promise<ReporteRespuestaDto> {
    return this.reportes.crear(dto);
  }
}
