import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface TokenPairBody {
  accessToken: string;
  refreshToken: string;
}

interface CreateUserBody {
  temporaryPassword: string;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const coachEmail = process.env.SEED_COACH_EMAIL!;
  const coachPassword = process.env.SEED_COACH_PASSWORD!;

  beforeAll(async () => {
    if (!coachEmail || !coachPassword) {
      throw new Error(
        'SEED_COACH_EMAIL and SEED_COACH_PASSWORD must be set to run this e2e suite',
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('runs the full login → RBAC → refresh rotation → logout flow', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: coachEmail, password: coachPassword })
      .expect(200);

    const coachTokens = login.body as TokenPairBody;
    expect(coachTokens.accessToken).toEqual(expect.any(String));
    expect(coachTokens.refreshToken).toEqual(expect.any(String));

    await request(app.getHttpServer()).post('/users').send({}).expect(401);

    const coacheeEmail = `coachee-${Date.now()}@example.com`;
    const created = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${coachTokens.accessToken}`)
      .send({ email: coacheeEmail, role: 'coachee' })
      .expect(201);

    const { temporaryPassword: coacheeTempPassword } =
      created.body as CreateUserBody;
    expect(coacheeTempPassword).toEqual(expect.any(String));

    const coacheeLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: coacheeEmail, password: coacheeTempPassword })
      .expect(200);
    const coacheeTokens = coacheeLogin.body as TokenPairBody;

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${coacheeTokens.accessToken}`)
      .send({ email: 'someone-else@example.com', role: 'coachee' })
      .expect(403);

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: coachTokens.refreshToken })
      .expect(200);
    const rotatedTokens = refreshed.body as TokenPairBody;

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: coachTokens.refreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${rotatedTokens.accessToken}`)
      .send({ refreshToken: rotatedTokens.refreshToken })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: rotatedTokens.refreshToken })
      .expect(401);
  });
});
