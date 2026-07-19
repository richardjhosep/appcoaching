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
}

interface CreateCoacheeResponse {
  coachee: CoacheeBody;
  temporaryPassword: string;
}

interface SesionBody {
  id: string;
}

interface CicloBody {
  id: string;
}

interface EmpresaCobroBody {
  empresaId: string;
  nombre: string;
  pagada: boolean;
  horasContratadas: number | null;
  horasConsumidas: number;
  ingresoDelPeriodo: number;
  ingresoProyectado: number;
}

interface ResumenBody {
  porEmpresa: EmpresaCobroBody[];
  horasRealizadasTotal: number;
  ingresoDelPeriodoTotal: number;
  ingresoProyectadoTotal: number;
  coacheesActivos: number;
  satisfaccionPromedio: number | null;
}

interface AlertasBody {
  ciclosPorVencer: Array<{
    coacheeId: string;
    nombre: string;
    sesionesRestantes: number;
  }>;
  coacheesSinLogros: Array<{ coacheeId: string; nombre: string }>;
  coacheesSinProximaSesion: Array<{ coacheeId: string; nombre: string }>;
}

interface AvancePorAreaBody {
  area: string;
  avancePromedio: number;
  coacheesCount: number;
}

describe('Negocio (e2e)', () => {
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

  it('runs the full resumen de cobros → alertas → avance por área flow', async () => {
    const server = app.getHttpServer();
    const auth = (token: string) => `Bearer ${token}`;

    const coachLogin = await request(server)
      .post('/auth/login')
      .send({ email: coachEmail, password: coachPassword })
      .expect(200);
    const coachToken = (coachLogin.body as TokenPairBody).accessToken;

    // horasRealizadasTotal/ingresos/coacheesActivos son cifras globales de la plataforma
    // (no aisladas por test), y otras suites e2e también crean sesiones/ciclos del mes
    // en curso cuando corren en paralelo contra la misma base. Se toma una foto "antes"
    // para comparar por delta en vez de valores absolutos, y así el test no sea frágil
    // ante lo que hagan otras suites.
    const resumenAntes = (
      await request(server)
        .get('/negocio/resumen')
        .set('Authorization', auth(coachToken))
        .expect(200)
    ).body as ResumenBody;

    const empresaA = await request(server)
      .post('/empresas')
      .set('Authorization', auth(coachToken))
      .send({ nombre: `Negocio Empresa A ${suffix}`, tarifaHora: 30000 })
      .expect(201);
    const empresaAId = (empresaA.body as EmpresaBody).id;

    const empresaB = await request(server)
      .post('/empresas')
      .set('Authorization', auth(coachToken))
      .send({ nombre: `Negocio Empresa B ${suffix}`, tarifaHora: 25000 })
      .expect(201);
    const empresaBId = (empresaB.body as EmpresaBody).id;

    await request(server)
      .patch(`/empresas/${empresaAId}`)
      .set('Authorization', auth(coachToken))
      .send({ pagada: true, horasContratadas: 10 })
      .expect(200);

    const coachee1 = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({
        nombre: 'Negocio Coachee Uno',
        email: `negocio1-${suffix}@example.com`,
        empresaId: empresaAId,
        areaGerencia: 'Comercial',
      })
      .expect(201);
    const { coachee: coacheeUno } = coachee1.body as CreateCoacheeResponse;

    const coachee2 = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({
        nombre: 'Negocio Coachee Dos',
        email: `negocio2-${suffix}@example.com`,
        empresaId: empresaBId,
        areaGerencia: 'Operaciones',
      })
      .expect(201);
    const { coachee: coacheeDos } = coachee2.body as CreateCoacheeResponse;

    const coachee3 = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({
        nombre: 'Negocio Coachee Tres',
        email: `negocio3-${suffix}@example.com`,
        tarifaPropia: 45000,
      })
      .expect(201);
    const { coachee: coacheeTres } = coachee3.body as CreateCoacheeResponse;

    // Ciclo abierto para coachee1: 1 sesión contratada, se completa exactamente esa,
    // así que queda 0 restantes → alerta por vencer activa.
    const ciclo = await request(server)
      .post('/ciclos')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId: coacheeUno.id, totalSesiones: 1 })
      .expect(201);
    expect((ciclo.body as CicloBody).id).toEqual(expect.any(String));

    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const sesionCoachee1 = await request(server)
      .post('/sesiones')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId: coacheeUno.id, fechaHora: pastDate })
      .expect(201);
    const sesionCoachee1Id = (sesionCoachee1.body as SesionBody).id;

    await request(server)
      .post('/sesiones')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId: coacheeDos.id, fechaHora: pastDate })
      .expect(201);
    await request(server)
      .post('/sesiones')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId: coacheeDos.id, fechaHora: futureDate })
      .expect(201);

    await request(server)
      .post('/sesiones')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId: coacheeTres.id, fechaHora: pastDate })
      .expect(201);
    await request(server)
      .post('/sesiones')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId: coacheeTres.id, fechaHora: futureDate })
      .expect(201);

    // --- Resumen de cobros ---
    const resumen = await request(server)
      .get('/negocio/resumen')
      .set('Authorization', auth(coachToken))
      .expect(200);
    const resumenBody = resumen.body as ResumenBody;

    const cobroA = resumenBody.porEmpresa.find(
      (e) => e.empresaId === empresaAId,
    )!;
    expect(cobroA.pagada).toBe(true);
    expect(cobroA.horasContratadas).toBe(10);
    expect(cobroA.horasConsumidas).toBe(1);
    expect(cobroA.ingresoDelPeriodo).toBe(30000);

    const cobroB = resumenBody.porEmpresa.find(
      (e) => e.empresaId === empresaBId,
    )!;
    expect(cobroB.pagada).toBe(false);
    expect(cobroB.horasConsumidas).toBe(1);
    expect(cobroB.ingresoDelPeriodo).toBe(0);
    expect(cobroB.ingresoProyectado).toBe(0);

    // Empresa A (pagada) + independiente (coachee3, tarifaPropia) cuentan en el total;
    // empresa B (no pagada) no aporta al ingreso pese a tener horas consumidas.
    // Comparados por delta contra la foto "antes" (ver comentario más arriba). Los
    // ingresos son exactos porque ninguna otra suite e2e marca una empresa "pagada" ni
    // define tarifaPropia en sus coachees (campos nuevos de este sprint), así que
    // ninguna otra suite corriendo en paralelo puede aportar ingreso distinto de cero.
    // horasRealizadasTotal/coacheesActivos sí son verdaderamente globales (cuentan toda
    // sesión/ciclo abierto de la plataforma), así que otras suites en paralelo pueden
    // sumar de más durante la ventana del test — se verifica que como mínimo se refleje
    // la propia contribución, no un valor exacto.
    expect(
      resumenBody.ingresoDelPeriodoTotal - resumenAntes.ingresoDelPeriodoTotal,
    ).toBe(30000 + 45000);
    expect(
      resumenBody.ingresoProyectadoTotal - resumenAntes.ingresoProyectadoTotal,
    ).toBe(45000);
    expect(
      resumenBody.horasRealizadasTotal - resumenAntes.horasRealizadasTotal,
    ).toBeGreaterThanOrEqual(3);
    expect(
      resumenBody.coacheesActivos - resumenAntes.coacheesActivos,
    ).toBeGreaterThanOrEqual(1);

    // --- Post-sesión publicado para coachee1 (alimenta avance por área y satisfacción) ---
    const coacheeUnoLogin = await request(server)
      .post('/auth/login')
      .send({
        email: `negocio1-${suffix}@example.com`,
        password: (coachee1.body as CreateCoacheeResponse).temporaryPassword,
      })
      .expect(200);
    const coacheeUnoToken = (coacheeUnoLogin.body as TokenPairBody).accessToken;

    await request(server)
      .patch(`/sesiones/${sesionCoachee1Id}/post-sesion`)
      .set('Authorization', auth(coacheeUnoToken))
      .send({
        aprendizaje: 'Aprendí bastante',
        utilidad: 5,
        cercaniaObjetivo: 8,
      })
      .expect(200);
    await request(server)
      .post(`/sesiones/${sesionCoachee1Id}/post-sesion/publicar`)
      .set('Authorization', auth(coacheeUnoToken))
      .expect(201);

    // --- Alertas de seguimiento ---
    const alertas = await request(server)
      .get('/negocio/alertas')
      .set('Authorization', auth(coachToken))
      .expect(200);
    const alertasBody = alertas.body as AlertasBody;

    expect(
      alertasBody.ciclosPorVencer.some((c) => c.coacheeId === coacheeUno.id),
    ).toBe(true);
    expect(
      alertasBody.coacheesSinLogros.some((c) => c.coacheeId === coacheeUno.id),
    ).toBe(true);
    expect(
      alertasBody.coacheesSinProximaSesion.some(
        (c) => c.coacheeId === coacheeUno.id,
      ),
    ).toBe(true);

    // --- Avance por área: coachee1 (Comercial) ya se autoevaluó (cercanía 8/10 → 80%) ---
    const avancePorArea = await request(server)
      .get('/negocio/avance-por-area')
      .set('Authorization', auth(coachToken))
      .expect(200);
    const grupos = avancePorArea.body as AvancePorAreaBody[];
    const comercial = grupos.find((g) => g.area === 'Comercial');
    expect(comercial).toEqual({
      area: 'Comercial',
      avancePromedio: 80,
      coacheesCount: 1,
    });
    expect(grupos.find((g) => g.area === 'Operaciones')).toBeUndefined();

    // --- Satisfacción promedio: es un agregado global de la plataforma (no aislado por
    // test), así que solo se valida que sea un número válido tras publicar una utilidad
    // real, sin asumir un valor exacto que otras suites en paralelo podrían alterar.
    const resumenFinal = await request(server)
      .get('/negocio/resumen')
      .set('Authorization', auth(coachToken))
      .expect(200);
    const satisfaccion = (resumenFinal.body as ResumenBody)
      .satisfaccionPromedio;
    expect(satisfaccion).not.toBeNull();
    expect(satisfaccion).toBeGreaterThanOrEqual(1);
    expect(satisfaccion).toBeLessThanOrEqual(5);
  });
});
