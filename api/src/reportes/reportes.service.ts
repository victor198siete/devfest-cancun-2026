import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../gemini/gemini.service.js';
import { CrearReporteDto } from './dto/crear-reporte.dto.js';
import { ReporteRespuestaDto } from './dto/reporte-respuesta.dto.js';
import { armarPrompt } from './reporte.prompt.js';

type ReporteGemini = Omit<ReporteRespuestaDto, 'mapaUrl'>;

@Injectable()
export class ReportesService {
  constructor(
    private readonly gemini: GeminiService,
    private readonly config: ConfigService,
  ) {}

  async crear(dto: CrearReporteDto): Promise<ReporteRespuestaDto> {
    const idioma = this.config.get<string>('AVISO_IDIOMA', 'es');
    const prompt = armarPrompt(dto.tipo, dto.nota, idioma);

    const resultado = await this.gemini.analizarImagen(dto.fotoBase64, dto.mimeType, prompt);
    if (!this.cumpleEsquema(resultado)) {
      throw new BadGatewayException('Gemini devolvió un reporte incompleto o con formato incorrecto');
    }

    // El mapa lo arma la API, no Gemini
    const mapaUrl = `https://www.google.com/maps/search/?api=1&query=${dto.latitud},${dto.longitud}`;
    return { ...resultado, mapaUrl };
  }

  private cumpleEsquema(r: unknown): r is ReporteGemini {
    const x = r as Partial<ReporteGemini> | null;
    return (
      typeof x === 'object' && x !== null &&
      typeof x.esMascota === 'boolean' &&
      typeof x.confianza === 'number' && x.confianza >= 0 && x.confianza <= 1 &&
      typeof x.especie === 'string' &&
      Array.isArray(x.senas) && x.senas.every((s) => typeof s === 'string') &&
      ['baja', 'media', 'alta'].includes(x.urgencia as string) &&
      typeof x.aviso === 'string'
    );
  }
}
