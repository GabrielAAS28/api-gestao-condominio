import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Teste e2e de fumaca: sobe a aplicacao inteira e valida o endpoint publico
 * de health. Exige um Postgres acessivel via DATABASE_URL (o workflow de CI
 * provisiona um service container para isso).
 */
describe('CONDIGTAL API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/health responde 200 com o banco no ar', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(res.body).toMatchObject({ status: 'ok', db: 'up' });
  });

  it('GET /api/rota-inexistente responde 404', async () => {
    await request(app.getHttpServer()).get('/api/rota-inexistente').expect(404);
  });
});
