import { Injectable, inject, signal } from '@angular/core';
import { SecureStorage } from '@ng-native/expo/secure-store';
import type { NuevoReporte, Resultado } from './modelos.ts';

export const API_RESPALDO = 'https://reportes-api-respaldo-238087494805.us-central1.run.app';
const TIMEOUT_MS = 45_000;

/** Quita espacios y la barra final: "https://x.app/ " -> "https://x.app". */
export const limpiarUrl = (url: string) => url.trim().replace(/\/+$/, '');

export type TipoError = 'red' | 'limite' | 'servidor' | 'validacion';

export class ReporteError extends Error {
  constructor(
    readonly tipo: TipoError,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

/** URL base de la API: se guarda en el teclado seguro y sobrevive entre sesiones. */
@Injectable({ providedIn: 'root' })
export class ApiUrl {
  readonly url = inject(SecureStorage).signal('apiUrl', API_RESPALDO);
  readonly esRespaldo = () => limpiarUrl(this.url()) === API_RESPALDO;

  restablecer() {
    this.url.set(API_RESPALDO);
  }
}

@Injectable({ providedIn: 'root' })
export class ReportesApi {
  private readonly apiUrl = inject(ApiUrl);

  async enviar(reporte: NuevoReporte): Promise<Resultado> {
    const control = new AbortController();
    const timer = setTimeout(() => control.abort(), TIMEOUT_MS);
    let respuesta: Response;
    try {
      respuesta = await fetch(`${limpiarUrl(this.apiUrl.url())}/reportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reporte),
        signal: control.signal,
      });
    } catch {
      throw new ReporteError('red', 'No pudimos conectar con la API o tardó demasiado. Revisa tu conexión.');
    } finally {
      clearTimeout(timer);
    }

    if (respuesta.ok) return (await respuesta.json()) as Resultado;
    throw await errorDeRespuesta(respuesta);
  }
}

/** Convierte una respuesta con error en un mensaje en español. */
async function errorDeRespuesta(respuesta: Response): Promise<ReporteError> {
  const mensajeApi = await leerMensaje(respuesta);
  switch (respuesta.status) {
    case 429:
      return new ReporteError('limite', mensajeApi ?? 'Demasiados reportes seguidos, espera un minuto.');
    case 502:
    case 503:
      return new ReporteError('servidor', mensajeApi ?? 'Gemini no está disponible ahora. Intenta de nuevo.');
    default:
      return new ReporteError('validacion', 'No pudimos procesar el reporte. Revisa la foto y los datos.');
  }
}

async function leerMensaje(respuesta: Response): Promise<string | null> {
  try {
    const { message } = (await respuesta.json()) as { message?: string | string[] };
    return (Array.isArray(message) ? message.join(' ') : message) ?? null;
  } catch {
    return null;
  }
}
