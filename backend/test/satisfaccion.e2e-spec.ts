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
}

interface CoacheeBody {
  id: string;
}

interface CreateCoacheeResponse {
  coachee: CoacheeBody;
  temporaryPassword: string;
}

interface CreateUserResponse {
  temporaryPassword: string;
}

interface SesionBody {
  id: string;
}

interface EncuestaBody {
  id: string;
  empresaId: string;
  calificacion: number;
}

interface SolicitudBody {
  id: string;
  estado: string;
  nombreSugerido: string;
}

interface KpisBody {
  procesosTerminados: number;
  procesosEnCurso: number;
  tasaAsistencia: number | null;
  satisfaccionPromedio: number | null;
}

interface CicloBody {
  id: string;
  coacheeId: string;
}

describe('Satisfacción y gestión comercial (e2e)', () => {
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

  it('runs the full encuesta → solicitud → asistencia → KPIs → procesos cerrados flow', async () => {
    const server = app.getHttpServer();
    const auth = (token: string) => `Bearer ${token}`;

    const coachLogin = await request(server)
      .post('/auth/login')
      .send({ email: coachEmail, password: coachPassword })
      .expect(200);
    const coachToken = (coachLogin.body as TokenPairBody).accessToken;

    const empresa = await request(server)
      .post('/empresas')
      .set('Authorization', auth(coachToken))
      .send({ nombre: `Satisfaccion SA ${suffix}`, tarifaHora: 25000 })
      .expect(201);
    const empresaId = (empresa.body as EmpresaBody).id;

    const empresaUser = await request(server)
      .post('/users')
      .set('Authorization', auth(coachToken))
      .send({
        email: `satisfaccion-empresa-${suffix}@example.com`,
        role: 'empresa',
        empresaId,
      })
      .expect(201);
    const empresaPassword = (empresaUser.body as CreateUserResponse)
      .temporaryPassword;
    const empresaLogin = await request(server)
      .post('/auth/login')
      .send({
        email: `satisfaccion-empresa-${suffix}@example.com`,
        password: empresaPassword,
      })
      .expect(200);
    const empresaToken = (empresaLogin.body as TokenPairBody).accessToken;

    const coacheeCreated = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({
        nombre: 'Satisfaccion Coachee',
        email: `satisfaccion-${suffix}@example.com`,
        empresaId,
      })
      .expect(201);
    const coacheeId = (coacheeCreated.body as CreateCoacheeResponse).coachee.id;

    // --- Encuesta de satisfacción (empresa) ---
    await request(server)
      .post('/satisfaccion/encuestas')
      .set('Authorization', auth(empresaToken))
      .send({ calificacion: 5, comentario: 'Excelente acompañamiento' })
      .expect(201);

    const misEncuestas = await request(server)
      .get('/satisfaccion/encuestas/me')
      .set('Authorization', auth(empresaToken))
      .expect(200);
    expect(misEncuestas.body as EncuestaBody[]).toHaveLength(1);

    const encuestasDesdeCoach = await request(server)
      .get(`/satisfaccion/encuestas/${empresaId}`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect((encuestasDesdeCoach.body as EncuestaBody[])[0].calificacion).toBe(
      5,
    );

    // --- Solicitud de nuevo proceso (empresa) ---
    const solicitudCreada = await request(server)
      .post('/satisfaccion/solicitudes')
      .set('Authorization', auth(empresaToken))
      .send({
        nombreSugerido: 'Nuevo Coachee Propuesto',
        mensaje: 'Necesitamos apoyo',
      })
      .expect(201);
    const solicitudId = (solicitudCreada.body as SolicitudBody).id;
    expect((solicitudCreada.body as SolicitudBody).estado).toBe('pendiente');

    const solicitudesPendientes = await request(server)
      .get('/satisfaccion/solicitudes?estado=pendiente')
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect(
      (solicitudesPendientes.body as SolicitudBody[]).some(
        (s) => s.id === solicitudId,
      ),
    ).toBe(true);

    await request(server)
      .patch(`/satisfaccion/solicitudes/${solicitudId}/atender`)
      .set('Authorization', auth(coachToken))
      .expect(200);

    const misSolicitudes = await request(server)
      .get('/satisfaccion/solicitudes/me')
      .set('Authorization', auth(empresaToken))
      .expect(200);
    expect((misSolicitudes.body as SolicitudBody[])[0].estado).toBe('atendida');

    // --- Asistencia y KPIs ---
    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const sesion1 = await request(server)
      .post('/sesiones')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId, fechaHora: pastDate })
      .expect(201);
    const sesion2 = await request(server)
      .post('/sesiones')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId, fechaHora: pastDate })
      .expect(201);

    await request(server)
      .patch(`/sesiones/${(sesion1.body as SesionBody).id}`)
      .set('Authorization', auth(coachToken))
      .send({ asistio: true })
      .expect(200);
    await request(server)
      .patch(`/sesiones/${(sesion2.body as SesionBody).id}`)
      .set('Authorization', auth(coachToken))
      .send({ asistio: false })
      .expect(200);

    const ciclo = await request(server)
      .post('/ciclos')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId, totalSesiones: 1 })
      .expect(201);
    const cicloId = (ciclo.body as CicloBody).id;
    await request(server)
      .post(`/ciclos/${cicloId}/cerrar`)
      .set('Authorization', auth(coachToken))
      .send({ resultado: 'logrado' })
      .expect(201);

    const kpisDesdeEmpresa = await request(server)
      .get('/satisfaccion/kpis/me')
      .set('Authorization', auth(empresaToken))
      .expect(200);
    const kpisEmpresa = kpisDesdeEmpresa.body as KpisBody;
    expect(kpisEmpresa.procesosTerminados).toBe(1);
    expect(kpisEmpresa.procesosEnCurso).toBe(0);
    expect(kpisEmpresa.tasaAsistencia).toBe(50);
    expect(kpisEmpresa.satisfaccionPromedio).toBe(5);

    const kpisDesdeCoach = await request(server)
      .get(`/satisfaccion/kpis/${empresaId}`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect(kpisDesdeCoach.body).toEqual(kpisEmpresa);

    // --- Procesos cerrados: aparece para "abrir nuevo proceso con [nombre]" ---
    const cerrados = await request(server)
      .get('/ciclos/cerrados')
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect((cerrados.body as CicloBody[]).some((c) => c.id === cicloId)).toBe(
      true,
    );

    // Con el ciclo anterior cerrado, se puede abrir uno nuevo para el mismo coachee
    // (la propia acción de "abrir nuevo proceso con [nombre]").
    await request(server)
      .post('/ciclos')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId, totalSesiones: 5 })
      .expect(201);
  });
});
