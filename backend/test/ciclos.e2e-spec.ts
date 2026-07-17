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

interface CicloBody {
  id: string;
  coacheeId: string;
  totalSesiones: number;
  fechaCierre: string | null;
  resultado: string | null;
  informeFinal: string | null;
  sesionesRealizadas: number;
  sesionesRestantes: number;
  alertaPorVencer: boolean;
}

describe('Ciclos de coaching (e2e)', () => {
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

  it('runs the full abrir → sesiones → alerta → informe → pdf → cerrar flow, with empresa read-only access', async () => {
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
      .send({ nombre: `Ciclos SA ${suffix}`, tarifaHora: 30000 })
      .expect(201);
    const empresaId = (empresa.body as EmpresaBody).id;

    const coacheeCreated = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({
        nombre: 'Ciclos Test',
        email: `ciclos-${suffix}@example.com`,
        empresaId,
      })
      .expect(201);
    const { coachee, temporaryPassword } =
      coacheeCreated.body as CreateCoacheeResponse;

    const otroCoacheeCreated = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({
        nombre: 'Ciclos Otro',
        email: `ciclos-otro-${suffix}@example.com`,
      })
      .expect(201);

    const empresaUser = await request(server)
      .post('/users')
      .set('Authorization', auth(coachToken))
      .send({
        email: `ciclos-empresa-${suffix}@example.com`,
        role: 'empresa',
        empresaId,
      })
      .expect(201);
    const empresaPassword = (empresaUser.body as CreateUserResponse)
      .temporaryPassword;
    const empresaLogin = await request(server)
      .post('/auth/login')
      .send({
        email: `ciclos-empresa-${suffix}@example.com`,
        password: empresaPassword,
      })
      .expect(200);
    const empresaToken = (empresaLogin.body as TokenPairBody).accessToken;

    // Abrir ciclo (3 sesiones contratadas).
    const cicloCreado = await request(server)
      .post('/ciclos')
      .set('Authorization', auth(coachToken))
      .send({
        coacheeId: coachee.id,
        totalSesiones: 3,
        resumenReunionInicial: 'Reunión con RRHH y jefatura directa.',
      })
      .expect(201);
    const ciclo = cicloCreado.body as CicloBody;
    expect(ciclo.sesionesRestantes).toBe(3);
    expect(ciclo.alertaPorVencer).toBe(false);

    // No se puede abrir un segundo ciclo mientras el primero sigue abierto.
    await request(server)
      .post('/ciclos')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId: coachee.id, totalSesiones: 5 })
      .expect(409);

    // Dos sesiones pasadas: deben vincularse automáticamente al ciclo abierto.
    const pastDate1 = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const pastDate2 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await request(server)
      .post('/sesiones')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId: coachee.id, fechaHora: pastDate1 })
      .expect(201);
    const sesion2 = await request(server)
      .post('/sesiones')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId: coachee.id, fechaHora: pastDate2 })
      .expect(201);
    expect((sesion2.body as SesionBody).id).toEqual(expect.any(String));

    // Con 2 de 3 sesiones realizadas, quedan <=2 restantes: alerta activa.
    const cicloConAlerta = await request(server)
      .get(`/ciclos/${ciclo.id}`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    const estadoConAlerta = cicloConAlerta.body as CicloBody;
    expect(estadoConAlerta.sesionesRealizadas).toBe(2);
    expect(estadoConAlerta.sesionesRestantes).toBe(1);
    expect(estadoConAlerta.alertaPorVencer).toBe(true);

    // La empresa ve la misma alerta (scoping ya probado, ahora sobre ciclos).
    const cicloDesdeEmpresa = await request(server)
      .get(`/ciclos/coachee/${coachee.id}/actual`)
      .set('Authorization', auth(empresaToken))
      .expect(200);
    expect((cicloDesdeEmpresa.body as CicloBody).alertaPorVencer).toBe(true);

    // La empresa no puede editar el resumen de reunión inicial (rol no habilitado).
    await request(server)
      .patch(`/ciclos/${ciclo.id}/resumen-reunion-inicial`)
      .set('Authorization', auth(empresaToken))
      .send({ resumenReunionInicial: 'intento de edición' })
      .expect(403);

    // El coachee ve su propio ciclo actual con el mismo estado.
    const coacheeLogin = await request(server)
      .post('/auth/login')
      .send({
        email: `ciclos-${suffix}@example.com`,
        password: temporaryPassword,
      })
      .expect(200);
    const coacheeToken = (coacheeLogin.body as TokenPairBody).accessToken;
    const cicloDesdeCoachee = await request(server)
      .get('/ciclos/me/actual')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    expect((cicloDesdeCoachee.body as CicloBody).alertaPorVencer).toBe(true);

    // Generar borrador de informe final desde los datos del coachee.
    const borrador = await request(server)
      .post(`/ciclos/${ciclo.id}/generar-borrador-informe`)
      .set('Authorization', auth(coachToken))
      .expect(201);
    expect((borrador.body as CicloBody).informeFinal).toContain(
      'Sesiones realizadas: 2 de 3',
    );

    // El coach edita el borrador a mano.
    const informeEditado = await request(server)
      .patch(`/ciclos/${ciclo.id}/informe-final`)
      .set('Authorization', auth(coachToken))
      .send({ informeFinal: 'Informe final editado a mano por el coach.' })
      .expect(200);
    expect((informeEditado.body as CicloBody).informeFinal).toBe(
      'Informe final editado a mano por el coach.',
    );

    // Subir el PDF del informe.
    await request(server)
      .post(`/ciclos/${ciclo.id}/informe-pdf`)
      .set('Authorization', auth(coachToken))
      .attach(
        'archivo',
        Buffer.from('%PDF-1.4 contenido de prueba'),
        'informe.pdf',
      )
      .expect(201);

    const descargaCoach = await request(server)
      .get(`/ciclos/${ciclo.id}/informe-pdf`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect((descargaCoach.body as Buffer).toString()).toContain(
      'contenido de prueba',
    );

    const descargaCoachee = await request(server)
      .get(`/ciclos/${ciclo.id}/informe-pdf`)
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    expect((descargaCoachee.body as Buffer).toString()).toContain(
      'contenido de prueba',
    );

    // Un coachee ajeno no puede descargar el informe.
    const otroLogin = await request(server)
      .post('/auth/login')
      .send({
        email: `ciclos-otro-${suffix}@example.com`,
        password: (otroCoacheeCreated.body as CreateCoacheeResponse)
          .temporaryPassword,
      })
      .expect(200);
    const otroToken = (otroLogin.body as TokenPairBody).accessToken;
    await request(server)
      .get(`/ciclos/${ciclo.id}/informe-pdf`)
      .set('Authorization', auth(otroToken))
      .expect(403);

    // Cerrar el ciclo con resultado.
    const cicloCerrado = await request(server)
      .post(`/ciclos/${ciclo.id}/cerrar`)
      .set('Authorization', auth(coachToken))
      .send({ resultado: 'logrado' })
      .expect(201);
    const cerrado = cicloCerrado.body as CicloBody;
    expect(cerrado.resultado).toBe('logrado');
    expect(cerrado.fechaCierre).toEqual(expect.any(String));
    expect(cerrado.alertaPorVencer).toBe(false);

    // No se puede cerrar dos veces.
    await request(server)
      .post(`/ciclos/${ciclo.id}/cerrar`)
      .set('Authorization', auth(coachToken))
      .send({ resultado: 'logrado' })
      .expect(409);

    // Historial del coachee: el ciclo cerrado queda visible.
    const historial = await request(server)
      .get(`/ciclos/coachee/${coachee.id}`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect(historial.body as CicloBody[]).toHaveLength(1);
    expect((historial.body as CicloBody[])[0].fechaCierre).not.toBeNull();

    // Con el ciclo anterior cerrado, se puede abrir uno nuevo para el mismo coachee.
    await request(server)
      .post('/ciclos')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId: coachee.id, totalSesiones: 8 })
      .expect(201);
  });
});
