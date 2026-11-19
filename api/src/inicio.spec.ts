import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { AppModule } from './app.module.js';
import { GeminiService } from './gemini/gemini.service.js';

describe('Página de inicio', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GeminiService)
      .useValue({ analizarImagen: () => Promise.resolve({}) })
      .compile();
    app = modulo.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / dice que la API está lista y muestra su dirección para pegarla en la app', async () => {
    const res = await request(app.getHttpServer())
      .get('/')
      .set('Host', 'reportes-api-abc.a.run.app')
      .set('X-Forwarded-Proto', 'https')
      .expect(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Tu API está lista');
    expect(res.text).toContain('https://reportes-api-abc.a.run.app');
  });

  it('GET / escapa el Host para no inyectar HTML', async () => {
    const res = await request(app.getHttpServer()).get('/').set('Host', '<script>x</script>').expect(200);
    expect(res.text).not.toContain('<script>x</script>');
  });

  it('GET /health sigue respondiendo igual', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' });
  });
});
