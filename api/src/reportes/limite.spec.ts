import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { AppModule } from '../app.module.js';
import { GeminiService } from '../gemini/gemini.service.js';

const peticion = {
  tipo: 'perdida',
  fotoBase64: 'aGVsbG8=',
  mimeType: 'image/jpeg',
  latitud: 21.1619,
  longitud: -86.8515,
};

describe('Límite de peticiones (Gemini simulado)', () => {
  let app: INestApplication;
  const gemini = { analizarImagen: vi.fn<GeminiService['analizarImagen']>() };

  beforeAll(async () => {
    process.env.LIMITE_POR_MINUTO = '2';
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GeminiService)
      .useValue(gemini)
      .compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.LIMITE_POR_MINUTO;
  });

  it('POST /reportes responde 429 en español al pasar el límite', async () => {
    gemini.analizarImagen.mockResolvedValue({
      esMascota: true, confianza: 0.9, especie: 'perro', senas: [], urgencia: 'media', aviso: 'x',
    });
    await request(app.getHttpServer()).post('/reportes').send(peticion).expect(201);
    await request(app.getHttpServer()).post('/reportes').send(peticion).expect(201);
    const { body } = await request(app.getHttpServer()).post('/reportes').send(peticion).expect(429);
    expect(body.message).toBe('Demasiados reportes seguidos, espera un minuto');
  });

  it('GET /health no se limita', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer()).get('/health').expect(200);
    }
  });
});
