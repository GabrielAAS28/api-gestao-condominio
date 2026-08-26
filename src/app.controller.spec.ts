import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './common/prisma/prisma.service';

describe('AppController (health)', () => {
  let controller: AppController;
  const prismaMock = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('retorna status "ok" e db "up" quando o banco responde', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

    const result = await controller.health();

    expect(result.status).toBe('ok');
    expect(result.db).toBe('up');
    expect(result.name).toBe('CONDIGTAL API');
    expect(typeof result.timestamp).toBe('string');
  });

  it('retorna status "degraded" e db "down" quando o banco falha', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));

    const result = await controller.health();

    expect(result.status).toBe('degraded');
    expect(result.db).toBe('down');
  });
});
