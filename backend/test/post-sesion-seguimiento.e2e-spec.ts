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
}

interface PostSesionBody {
  publicada: boolean;
  aprendizaje: string | null;
  utilidad: number | null;
  cercaniaObjetivo: number | null;
}

interface LogroBody {
  id: string;
  descripcion: string;
}

interface DiarioBody {
  contenido: string;
}

describe('Post-sesión y seguimiento (e2e)', () => {
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

  it('runs the full post-sesión draft → publicar → inmutable flow, feeding avance/línea de progreso/logros/diario', async () => {
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
      .send({
        nombre: 'Post Sesión Test',
        email: `postsesion-${suffix}@example.com`,
      })
      .expect(201);
    const { coachee, temporaryPassword } =
      coacheeCreated.body as CreateCoacheeResponse;

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const sesionPasada = await request(server)
      .post('/sesiones')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId: coachee.id, fechaHora: pastDate })
      .expect(201);
    const sesionPasadaId = (sesionPasada.body as SesionBody).id;

    const sesionFutura = await request(server)
      .post('/sesiones')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId: coachee.id, fechaHora: futureDate })
      .expect(201);
    const sesionFuturaId = (sesionFutura.body as SesionBody).id;

    const coacheeLogin = await request(server)
      .post('/auth/login')
      .send({
        email: `postsesion-${suffix}@example.com`,
        password: temporaryPassword,
      })
      .expect(200);
    const coacheeToken = (coacheeLogin.body as TokenPairBody).accessToken;

    // No se puede completar el post-sesión de una sesión futura.
    await request(server)
      .patch(`/sesiones/${sesionFuturaId}/post-sesion`)
      .set('Authorization', auth(coacheeToken))
      .send({ aprendizaje: 'no debería aceptarse' })
      .expect(400);

    // Guardar borrador de a poco.
    await request(server)
      .patch(`/sesiones/${sesionPasadaId}/post-sesion`)
      .set('Authorization', auth(coacheeToken))
      .send({ aprendizaje: 'Aprendí a delegar mejor' })
      .expect(200);

    // Publicar sin utilidad/cercanía aún → rechazado.
    await request(server)
      .post(`/sesiones/${sesionPasadaId}/post-sesion/publicar`)
      .set('Authorization', auth(coacheeToken))
      .expect(400);

    const completado = await request(server)
      .patch(`/sesiones/${sesionPasadaId}/post-sesion`)
      .set('Authorization', auth(coacheeToken))
      .send({
        utilidad: 4,
        cercaniaObjetivo: 7,
        recomendacion: 'Más ejercicios prácticos',
        temasProximaSesion: 'Comunicación con el equipo',
      })
      .expect(200);
    expect((completado.body as PostSesionBody).publicada).toBe(false);

    const publicado = await request(server)
      .post(`/sesiones/${sesionPasadaId}/post-sesion/publicar`)
      .set('Authorization', auth(coacheeToken))
      .expect(201);
    expect((publicado.body as PostSesionBody).publicada).toBe(true);

    // Inmutable: ni editar ni volver a publicar.
    await request(server)
      .patch(`/sesiones/${sesionPasadaId}/post-sesion`)
      .set('Authorization', auth(coacheeToken))
      .send({ aprendizaje: 'intento de edición' })
      .expect(403);
    await request(server)
      .post(`/sesiones/${sesionPasadaId}/post-sesion/publicar`)
      .set('Authorization', auth(coacheeToken))
      .expect(403);

    // avanceRealDe: mismo número para coachee y coach.
    const avanceCoachee = await request(server)
      .get('/seguimiento/avance/me')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    expect(avanceCoachee.body).toEqual({ avance: 70 });

    const avanceCoach = await request(server)
      .get(`/seguimiento/avance/${coachee.id}`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect(avanceCoach.body).toEqual({ avance: 70 });

    // Línea de progreso.
    const lineaProgreso = await request(server)
      .get('/seguimiento/linea-progreso/me')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    const puntos = lineaProgreso.body as Array<{
      sesionId: string;
      fecha: string;
      cercaniaObjetivo: number;
    }>;
    expect(puntos).toHaveLength(1);
    expect(puntos[0].sesionId).toBe(sesionPasadaId);
    expect(puntos[0].cercaniaObjetivo).toBe(7);
    expect(typeof puntos[0].fecha).toBe('string');

    // Logros.
    await request(server)
      .post('/seguimiento/logros')
      .set('Authorization', auth(coacheeToken))
      .send({
        fecha: '2026-07-10',
        descripcion: 'Terminé el curso de liderazgo',
      })
      .expect(201);

    const misLogros = await request(server)
      .get('/seguimiento/logros/me')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    const logrosBody = misLogros.body as LogroBody[];
    expect(logrosBody).toHaveLength(1);

    const logrosDesdeCoach = await request(server)
      .get(`/seguimiento/logros/${coachee.id}`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect(logrosDesdeCoach.body as LogroBody[]).toHaveLength(1);

    await request(server)
      .delete(`/seguimiento/logros/me/${logrosBody[0].id}`)
      .set('Authorization', auth(coacheeToken))
      .expect(200);

    // Diario: auto-creado en blanco, se guarda y persiste.
    const diarioInicial = await request(server)
      .get('/seguimiento/diario/me')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    expect((diarioInicial.body as DiarioBody).contenido).toBe('');

    await request(server)
      .patch('/seguimiento/diario/me')
      .set('Authorization', auth(coacheeToken))
      .send({ contenido: 'Hoy reflexioné sobre mi proceso.' })
      .expect(200);

    const diarioActualizado = await request(server)
      .get('/seguimiento/diario/me')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    expect((diarioActualizado.body as DiarioBody).contenido).toBe(
      'Hoy reflexioné sobre mi proceso.',
    );
  });
});
