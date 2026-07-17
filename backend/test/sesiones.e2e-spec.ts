import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface TokenPairBody {
  accessToken: string;
  refreshToken: string;
}

interface CoacheeBody {
  id: string;
}

interface CreateCoacheeResponse {
  coachee: CoacheeBody;
  temporaryPassword: string;
}

interface SesionBody {
  id: string;
  fechaHora: string;
  resumenCompartido: string | null;
  notasPrivadas?: string | null;
}

interface SolicitudBody {
  id: string;
  sesionId: string;
  estado: string;
}

describe('Sesiones (e2e)', () => {
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

  it('runs the full agendar → resumen/notas → reagendamiento flow', async () => {
    const server = app.getHttpServer();
    const auth = (token: string) => `Bearer ${token}`;

    const coachLogin = await request(server)
      .post('/auth/login')
      .send({ email: coachEmail, password: coachPassword })
      .expect(200);
    const coachToken = (coachLogin.body as TokenPairBody).accessToken;

    const coacheeCreated = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({ nombre: 'Rodrigo Peña', email: `rodrigo-${suffix}@example.com` })
      .expect(201);
    const { coachee, temporaryPassword } =
      coacheeCreated.body as CreateCoacheeResponse;

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const sesionCreated = await request(server)
      .post('/sesiones')
      .set('Authorization', auth(coachToken))
      .send({
        coacheeId: coachee.id,
        fechaHora: futureDate,
        linkVideollamada: 'https://meet.example.com/rodrigo',
      })
      .expect(201);
    const sesionId = (sesionCreated.body as SesionBody).id;

    await request(server)
      .patch(`/sesiones/${sesionId}`)
      .set('Authorization', auth(coachToken))
      .send({
        resumenCompartido: 'Buen avance en la sesión.',
        notasPrivadas: 'Nota interna del coach.',
      })
      .expect(200);

    const coacheeLogin = await request(server)
      .post('/auth/login')
      .send({
        email: `rodrigo-${suffix}@example.com`,
        password: temporaryPassword,
      })
      .expect(200);
    const coacheeToken = (coacheeLogin.body as TokenPairBody).accessToken;

    const misSesiones = await request(server)
      .get('/sesiones/me')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    const misSesionesBody = misSesiones.body as SesionBody[];
    expect(misSesionesBody).toHaveLength(1);
    expect(misSesionesBody[0].resumenCompartido).toBe(
      'Buen avance en la sesión.',
    );
    expect(misSesionesBody[0]).not.toHaveProperty('notasPrivadas');
    expect(JSON.stringify(misSesiones.body)).not.toContain(
      'Nota interna del coach',
    );

    const proxima = await request(server)
      .get('/sesiones/me/proxima')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    expect((proxima.body as SesionBody).id).toBe(sesionId);
    expect(proxima.body).not.toHaveProperty('notasPrivadas');

    await request(server)
      .post(`/sesiones/${sesionId}/reagendamiento`)
      .set('Authorization', auth(coacheeToken))
      .send({ motivo: 'Tengo un viaje ese día' })
      .expect(201);

    const pendientes = await request(server)
      .get('/solicitudes-reagendamiento')
      .set('Authorization', auth(coachToken))
      .expect(200);
    const solicitud = (pendientes.body as SolicitudBody[]).find(
      (s) => s.sesionId === sesionId,
    );
    expect(solicitud).toBeDefined();

    const nuevaFecha = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await request(server)
      .post(`/solicitudes-reagendamiento/${solicitud!.id}/responder`)
      .set('Authorization', auth(coachToken))
      .send({
        nuevaFechaHora: nuevaFecha,
        respuestaCoach: 'Sin problema, movámosla.',
      })
      .expect(201);

    const sesionActualizada = await request(server)
      .get(`/sesiones/${sesionId}`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    const actualizadaBody = sesionActualizada.body as SesionBody;
    expect(new Date(actualizadaBody.fechaHora).toISOString()).toBe(nuevaFecha);
    expect(actualizadaBody.notasPrivadas).toBe('Nota interna del coach.');

    // Un segundo coachee no puede solicitar reagendamiento sobre una sesión ajena.
    const otroCoachee = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({ nombre: 'Otro Coachee', email: `otro-${suffix}@example.com` })
      .expect(201);
    const otroLogin = await request(server)
      .post('/auth/login')
      .send({
        email: `otro-${suffix}@example.com`,
        password: (otroCoachee.body as CreateCoacheeResponse).temporaryPassword,
      })
      .expect(200);
    const otroToken = (otroLogin.body as TokenPairBody).accessToken;

    await request(server)
      .post(`/sesiones/${sesionId}/reagendamiento`)
      .set('Authorization', auth(otroToken))
      .send({})
      .expect(404);
  });
});
