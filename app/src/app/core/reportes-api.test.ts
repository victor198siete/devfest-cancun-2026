import { Injector, signal } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NuevoReporte } from './modelos.ts';
import { ApiUrl, ReporteError, ReportesApi } from './reportes-api.ts';

const reporte: NuevoReporte = {
  tipo: 'perdida',
  fotoBase64: 'AAAA',
  mimeType: 'image/jpeg',
  latitud: 21.2011,
  longitud: -86.8236,
  nota: 'collar azul',
};

function crearApi(url: string, respuesta: Response | Error) {
  const fetchFalso = vi.fn(async () => {
    if (respuesta instanceof Error) throw respuesta;
    return respuesta;
  });
  vi.stubGlobal('fetch', fetchFalso);
  const injector = Injector.create({
    providers: [ReportesApi, { provide: ApiUrl, useValue: { url: signal(url) } }],
  });
  return { api: injector.get(ReportesApi), fetchFalso };
}

const json = (status: number, cuerpo: unknown) => new Response(JSON.stringify(cuerpo), { status });

afterEach(() => vi.unstubAllGlobals());

describe('ReportesApi.enviar', () => {
  it('manda el cuerpo correcto a /reportes y quita la barra final de la URL', async () => {
    const { api, fetchFalso } = crearApi('https://mi-api.test///', json(201, { esMascota: true }));
    await api.enviar(reporte);

    const [url, opciones] = fetchFalso.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://mi-api.test/reportes');
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body as string)).toEqual(reporte);
  });

  it.each([
    [429, 'limite', 'Demasiados reportes seguidos, espera un minuto'],
    [502, 'servidor', 'Gemini devolvió una respuesta inválida'],
    [503, 'servidor', 'Gemini está ocupado, intenta de nuevo'],
  ])('un %i muestra el mensaje de la API', async (status, tipo, message) => {
    const { api } = crearApi('https://x.test', json(status, { message }));
    await expect(api.enviar(reporte)).rejects.toMatchObject({ tipo, message });
  });

  it('un 400 da un mensaje genérico en español', async () => {
    const { api } = crearApi('https://x.test', json(400, { message: ['tipo must be one of'] }));
    await expect(api.enviar(reporte)).rejects.toMatchObject({
      tipo: 'validacion',
      message: 'No pudimos procesar el reporte. Revisa la foto y los datos.',
    });
  });

  it('un fallo de red es un ReporteError de tipo red', async () => {
    const { api } = crearApi('https://x.test', new TypeError('Network request failed'));
    const error = await api.enviar(reporte).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ReporteError);
    expect(error).toMatchObject({ tipo: 'red' });
  });
});
