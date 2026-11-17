import { BadGatewayException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { HealthController } from '../health.controller.js';
import { GeminiService } from '../gemini/gemini.service.js';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ReportesController } from './reportes.controller.js';
import { ReportesService } from './reportes.service.js';

const reporteValido = {
  esMascota: true,
  confianza: 0.9,
  especie: 'perro',
  senas: ['collar rojo'],
  urgencia: 'media',
  aviso: 'Perro perdido en Cancún.',
};

const peticion = {
  tipo: 'perdida',
  fotoBase64: 'aGVsbG8=',
  mimeType: 'image/jpeg',
  latitud: 21.1619,
  longitud: -86.8515,
};

describe('API de reportes (Gemini simulado)', () => {
  let app: INestApplication;
  const gemini = { analizarImagen: vi.fn<GeminiService['analizarImagen']>() };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 1000 }] })],
      controllers: [ReportesController, HealthController],
      providers: [ReportesService, { provide: GeminiService, useValue: gemini }],
    }).compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => {
    gemini.analizarImagen.mockReset();
  });

  it.each([
    ['sin foto', { ...peticion, fotoBase64: undefined }],
    ['tipo inválido', { ...peticion, tipo: 'robo' }],
    ['latitud fuera de rango', { ...peticion, latitud: 95 }],
  ])('rechaza con 400: %s', async (_caso, cuerpo) => {
    await request(app.getHttpServer()).post('/reportes').send(cuerpo).expect(400);
    expect(gemini.analizarImagen).not.toHaveBeenCalled();
  });

  it('devuelve el reporte de Gemini más mapaUrl con las coordenadas', async () => {
    gemini.analizarImagen.mockResolvedValue(reporteValido);
    const { body } = await request(app.getHttpServer()).post('/reportes').send(peticion).expect(201);
    expect(body).toEqual({
      ...reporteValido,
      mapaUrl: 'https://www.google.com/maps/search/?api=1&query=21.1619,-86.8515',
    });
  });

  it('entrega tal cual esMascota false', async () => {
    const sinAnimal = { ...reporteValido, esMascota: false, confianza: 0.1, especie: 'ninguna', senas: [] };
    gemini.analizarImagen.mockResolvedValue(sinAnimal);
    const { body } = await request(app.getHttpServer()).post('/reportes').send(peticion).expect(201);
    expect(body).toMatchObject(sinAnimal);
  });

  it('responde 502 si Gemini no cumple el esquema', async () => {
    gemini.analizarImagen.mockResolvedValue({ esMascota: true });
    await request(app.getHttpServer()).post('/reportes').send(peticion).expect(502);
  });

  it('responde 502 si Gemini devuelve JSON inválido', async () => {
    gemini.analizarImagen.mockRejectedValue(new BadGatewayException('JSON inválido'));
    await request(app.getHttpServer()).post('/reportes').send(peticion).expect(502);
  });

  it('GET /health responde 200', async () => {
    const { body } = await request(app.getHttpServer()).get('/health').expect(200);
    expect(body).toEqual({ status: 'ok' });
  });
});
