import { ApiError, GoogleGenAI } from '@google/genai';
import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { reporteSchema } from '../reportes/reporte.schema.js';

@Injectable()
export class GeminiService {
  private cliente?: GoogleGenAI;
  private readonly logger = new Logger(GeminiService.name);

  constructor(private readonly config: ConfigService) {}

  // Modo Vertex: usa las credenciales por defecto de Google Cloud, sin claves en el código.
  // Se crea en la primera llamada para que la API arranque aunque falte configurar el proyecto.
  private get ai(): GoogleGenAI {
    this.cliente ??= new GoogleGenAI({
      vertexai: true,
      project: this.config.get<string>('GOOGLE_CLOUD_PROJECT'),
      location: this.config.get<string>('GOOGLE_CLOUD_LOCATION', 'global'),
    });
    return this.cliente;
  }

  async analizarImagen(fotoBase64: string, mimeType: string, prompt: string): Promise<unknown> {
    let texto: string | undefined;
    try {
      const respuesta = await this.ai.models.generateContent({
        model: this.config.get<string>('GEMINI_MODEL', 'gemini-3.8-flash'),
        contents: [{ role: 'user', parts: [{ inlineData: { data: fotoBase64, mimeType } }, { text: prompt }] }],
        config: { responseMimeType: 'application/json', responseSchema: reporteSchema },
      });
      texto = respuesta.text;
    } catch (error) {
      // Solo el estado y el mensaje de Vertex: nunca la foto ni la ubicación
      const estado = error instanceof ApiError ? error.status : 'sin estado';
      this.logger.error(`Gemini falló (${estado}): ${error instanceof Error ? error.message : error}`);
      if (error instanceof ApiError && error.status === 429) {
        throw new ServiceUnavailableException('Gemini está ocupado, intenta de nuevo en unos segundos');
      }
      throw new BadGatewayException('No se pudo obtener respuesta de Gemini');
    }

    try {
      return JSON.parse(texto ?? '');
    } catch {
      throw new BadGatewayException('Gemini devolvió una respuesta que no es JSON válido');
    }
  }
}
