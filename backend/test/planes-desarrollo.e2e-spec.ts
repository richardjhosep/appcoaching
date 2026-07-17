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

interface CompetenciaBody {
  id: string;
}

interface ObjetivoBody {
  id: string;
}

interface PlanBody {
  id: string;
  coacheeId: string;
  estado: string;
  comentarioCoach: string | null;
  habitoCuando: string | null;
  formacionLibros: string | null;
  objetivos: ObjetivoBody[];
  actividades: { id: string; objetivoId: string; actividad: string }[];
}

describe('Planes de desarrollo (e2e)', () => {
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

  it('runs the full definición → envío → cambios solicitados → reenvío → aprobación flow', async () => {
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
        nombre: 'María Fernanda Soto',
        email: `maria-plan-${suffix}@example.com`,
      })
      .expect(201);
    const { coachee, temporaryPassword } =
      coacheeCreated.body as CreateCoacheeResponse;

    const coacheeLogin = await request(server)
      .post('/auth/login')
      .send({
        email: `maria-plan-${suffix}@example.com`,
        password: temporaryPassword,
      })
      .expect(200);
    const coacheeToken = (coacheeLogin.body as TokenPairBody).accessToken;

    const competencias = await request(server)
      .get('/competencias')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    const competenciaId = (competencias.body as CompetenciaBody[])[0].id;

    const blank = await request(server)
      .get('/planes-desarrollo/me')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    expect((blank.body as PlanBody).estado).toBe('sin_enviar');

    await request(server)
      .patch('/planes-desarrollo/me')
      .set('Authorization', auth(coacheeToken))
      .send({
        competenciaId,
        nivelActual: 2,
        nivelObjetivo: 4,
        plazo: '3 meses',
        descripcionEstadoActual: 'Le cuesta delegar decisiones.',
        objetivoGeneral: 'Liderar con mayor autonomía del equipo.',
      })
      .expect(200);

    const objetivo1 = await request(server)
      .post('/planes-desarrollo/me/objetivos')
      .set('Authorization', auth(coacheeToken))
      .send({ descripcion: 'Delegar una decisión clave por semana.' })
      .expect(201);
    const objetivoId = (objetivo1.body as ObjetivoBody).id;
    await request(server)
      .post('/planes-desarrollo/me/objetivos')
      .set('Authorization', auth(coacheeToken))
      .send({ descripcion: 'Revisar avances con el equipo cada viernes.' })
      .expect(201);

    // Hábito y formación son de libre edición, se guardan junto a la definición.
    await request(server)
      .patch('/planes-desarrollo/me')
      .set('Authorization', auth(coacheeToken))
      .send({
        habitoCuando: 'Antes de decisiones que afectan a más de un área.',
        habitoEnVezDe: 'Decidir solo y comunicar después.',
        habitoVoyA: 'Delegar la decisión con un criterio claro.',
        formacionLibros: 'Multipliers – Liz Wiseman',
      })
      .expect(200);

    // Plan de ejecución: una actividad ligada a un único objetivo primario.
    const actividadCreada = await request(server)
      .post('/planes-desarrollo/me/actividades')
      .set('Authorization', auth(coacheeToken))
      .send({
        objetivoId,
        actividad: 'Identificar 3 decisiones delegables esta semana.',
      })
      .expect(201);
    expect((actividadCreada.body as { objetivoId: string }).objetivoId).toBe(
      objetivoId,
    );

    const sentPlan = await request(server)
      .post('/planes-desarrollo/me/enviar')
      .set('Authorization', auth(coacheeToken))
      .expect(201);
    const sentPlanBody = sentPlan.body as PlanBody;
    expect(sentPlanBody.estado).toBe('pendiente_aprobacion');
    expect(sentPlanBody.habitoCuando).toBe(
      'Antes de decisiones que afectan a más de un área.',
    );
    expect(sentPlanBody.formacionLibros).toBe('Multipliers – Liz Wiseman');
    expect(sentPlanBody.actividades).toHaveLength(1);

    // Bloqueado mientras está pendiente de aprobación.
    await request(server)
      .patch('/planes-desarrollo/me')
      .set('Authorization', auth(coacheeToken))
      .send({ objetivoGeneral: 'Intento de cambio bloqueado' })
      .expect(403);

    // Hábito/formación y el plan de ejecución NUNCA se bloquean, ni pendiente de aprobación.
    await request(server)
      .patch('/planes-desarrollo/me')
      .set('Authorization', auth(coacheeToken))
      .send({ habitoSencillo: 'Plantilla de 5 minutos antes de cada reunión.' })
      .expect(200);
    await request(server)
      .post('/planes-desarrollo/me/actividades')
      .set('Authorization', auth(coacheeToken))
      .send({
        objetivoId,
        actividad: 'Revisar avances del hábito cada viernes.',
      })
      .expect(201);

    const pendientes = await request(server)
      .get('/planes-desarrollo?estado=pendiente_aprobacion')
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect(
      (pendientes.body as PlanBody[]).some((p) => p.coacheeId === coachee.id),
    ).toBe(true);

    const conCambios = await request(server)
      .post(`/planes-desarrollo/${coachee.id}/solicitar-cambios`)
      .set('Authorization', auth(coachToken))
      .send({ comentario: 'Sé más específico en el objetivo general.' })
      .expect(201);
    expect((conCambios.body as PlanBody).estado).toBe('cambios_solicitados');
    expect((conCambios.body as PlanBody).comentarioCoach).toBe(
      'Sé más específico en el objetivo general.',
    );

    // Ya no está bloqueado: el coachee puede ajustar y reenviar.
    await request(server)
      .patch('/planes-desarrollo/me')
      .set('Authorization', auth(coacheeToken))
      .send({
        objetivoGeneral:
          'Liderar con mayor autonomía y visibilidad del equipo.',
      })
      .expect(200);
    await request(server)
      .post('/planes-desarrollo/me/enviar')
      .set('Authorization', auth(coacheeToken))
      .expect(201);

    const aprobado = await request(server)
      .post(`/planes-desarrollo/${coachee.id}/aprobar`)
      .set('Authorization', auth(coachToken))
      .expect(201);
    expect((aprobado.body as PlanBody).estado).toBe('aprobado');

    // No se puede aprobar dos veces seguidas sin un nuevo envío.
    await request(server)
      .post(`/planes-desarrollo/${coachee.id}/aprobar`)
      .set('Authorization', auth(coachToken))
      .expect(409);
  });
});
