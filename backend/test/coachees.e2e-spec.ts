import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface TokenPairBody {
  accessToken: string;
  refreshToken: string;
}

interface EmpresaBody {
  id: string;
  nombre: string;
}

interface CoacheeBody {
  id: string;
  empresaId: string | null;
  telefono: string | null;
  emailContacto: string | null;
}

interface CreateCoacheeResponse {
  coachee: CoacheeBody;
  temporaryPassword: string;
}

interface CreateUserResponse {
  temporaryPassword: string;
}

describe('Empresas/Coachees (e2e)', () => {
  let app: INestApplication<App>;
  const coachEmail = process.env.SEED_COACH_EMAIL!;
  const coachPassword = process.env.SEED_COACH_PASSWORD!;
  const suffix = Date.now();

  beforeAll(async () => {
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

  it('enforces multi-tenant scoping and self-managed contact', async () => {
    const server = app.getHttpServer();

    const coachLogin = await request(server)
      .post('/auth/login')
      .send({ email: coachEmail, password: coachPassword })
      .expect(200);
    const coachToken = (coachLogin.body as TokenPairBody).accessToken;
    const auth = (token: string) => `Bearer ${token}`;

    const empresaA = await request(server)
      .post('/empresas')
      .set('Authorization', auth(coachToken))
      .send({ nombre: `Empresa A ${suffix}`, tarifaHora: 40000 })
      .expect(201);
    const empresaB = await request(server)
      .post('/empresas')
      .set('Authorization', auth(coachToken))
      .send({ nombre: `Empresa B ${suffix}`, tarifaHora: 50000 })
      .expect(201);
    const empresaAId = (empresaA.body as EmpresaBody).id;
    const empresaBId = (empresaB.body as EmpresaBody).id;

    const independiente = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({
        nombre: 'Ignacio Prieto',
        email: `ignacio-${suffix}@example.com`,
      })
      .expect(201);
    const coacheeA = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({
        nombre: 'María Fernanda Soto',
        email: `maria-${suffix}@example.com`,
        empresaId: empresaAId,
      })
      .expect(201);
    const coacheeB = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({
        nombre: 'Camila Rojas',
        email: `camila-${suffix}@example.com`,
        empresaId: empresaBId,
      })
      .expect(201);

    const coacheeABody = (coacheeA.body as CreateCoacheeResponse).coachee;
    const coacheeBBody = (coacheeB.body as CreateCoacheeResponse).coachee;
    const independienteBody = (independiente.body as CreateCoacheeResponse)
      .coachee;

    const empresaAUser = await request(server)
      .post('/users')
      .set('Authorization', auth(coachToken))
      .send({
        email: `empresa-a-${suffix}@example.com`,
        role: 'empresa',
        empresaId: empresaAId,
      })
      .expect(201);
    const empresaAPassword = (empresaAUser.body as CreateUserResponse)
      .temporaryPassword;

    const empresaALogin = await request(server)
      .post('/auth/login')
      .send({
        email: `empresa-a-${suffix}@example.com`,
        password: empresaAPassword,
      })
      .expect(200);
    const empresaAToken = (empresaALogin.body as TokenPairBody).accessToken;

    const listAsEmpresaA = await request(server)
      .get('/coachees')
      .set('Authorization', auth(empresaAToken))
      .expect(200);
    const listedIds = (listAsEmpresaA.body as CoacheeBody[]).map((c) => c.id);
    expect(listedIds).toContain(coacheeABody.id);
    expect(listedIds).not.toContain(coacheeBBody.id);
    expect(listedIds).not.toContain(independienteBody.id);

    await request(server)
      .get(`/coachees/${coacheeBBody.id}`)
      .set('Authorization', auth(empresaAToken))
      .expect(403);
    await request(server)
      .get(`/coachees/${independienteBody.id}`)
      .set('Authorization', auth(empresaAToken))
      .expect(403);
    await request(server)
      .get(`/coachees/${coacheeABody.id}`)
      .set('Authorization', auth(empresaAToken))
      .expect(200);

    const coacheeALogin = await request(server)
      .post('/auth/login')
      .send({
        email: `maria-${suffix}@example.com`,
        password: (coacheeA.body as CreateCoacheeResponse).temporaryPassword,
      })
      .expect(200);
    const coacheeAToken = (coacheeALogin.body as TokenPairBody).accessToken;

    await request(server)
      .patch('/coachees/me/contact')
      .set('Authorization', auth(coacheeAToken))
      .send({
        telefono: '+56 9 1234 5678',
        emailContacto: 'maria.personal@example.com',
      })
      .expect(200);

    const viewedByCoach = await request(server)
      .get(`/coachees/${coacheeABody.id}`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    const viewedBody = viewedByCoach.body as CoacheeBody & {
      user?: Record<string, unknown>;
    };
    expect(viewedBody.telefono).toBe('+56 9 1234 5678');
    expect(viewedBody.emailContacto).toBe('maria.personal@example.com');
    expect(JSON.stringify(viewedByCoach.body)).not.toContain('passwordHash');
  });
});
