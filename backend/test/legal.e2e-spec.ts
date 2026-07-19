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

interface DocumentoLegalBody {
  estado: string;
  fecha: string | null;
  vigencia: string | null;
}

interface EmpresaLegalBody {
  empresaId: string;
  nombre: string;
  contrato: DocumentoLegalBody;
  nda: DocumentoLegalBody;
  coacheesConConsentimiento: number;
  coacheesTotal: number;
}

interface MedidaCumplimientoBody {
  id: string;
  descripcion: string;
  activa: boolean;
}

interface AuditLogBody {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
}

interface ResultadoBusquedaBody {
  coachees: Array<{ id: string; nombre: string }>;
  empresas: Array<{ id: string; nombre: string }>;
  competencias: Array<{ id: string; nombre: string }>;
  recursos: Array<{ id: string; titulo: string }>;
}

describe('Legal, auditoría y búsqueda global (e2e)', () => {
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

  it('runs the full contratos/NDA → consentimiento → cumplimiento → auditoría → búsqueda flow', async () => {
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
      .send({ nombre: `Legal SA ${suffix}`, tarifaHora: 20000 })
      .expect(201);
    const empresaId = (empresa.body as EmpresaBody).id;

    const coachee = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({
        nombre: `Legal Coachee ${suffix}`,
        email: `legal-${suffix}@example.com`,
        empresaId,
      })
      .expect(201);
    const coacheeId = (coachee.body as CreateCoacheeResponse).coachee.id;

    // --- Contratos y NDA: por defecto pendientes, sin ningún documento creado ---
    const resumenInicial = await request(server)
      .get('/legal/resumen')
      .set('Authorization', auth(coachToken))
      .expect(200);
    const propioInicial = (resumenInicial.body as EmpresaLegalBody[]).find(
      (e) => e.empresaId === empresaId,
    )!;
    expect(propioInicial.contrato.estado).toBe('pendiente');
    expect(propioInicial.nda.estado).toBe('pendiente');
    expect(propioInicial.coacheesTotal).toBe(1);
    expect(propioInicial.coacheesConConsentimiento).toBe(0);

    // El coach marca el contrato como firmado.
    await request(server)
      .put(`/legal/documentos/${empresaId}/contrato`)
      .set('Authorization', auth(coachToken))
      .send({ estado: 'firmado', fecha: '2026-01-15', vigencia: '2027-01-15' })
      .expect(200);

    // Un tipo inválido es rechazado con 400, no con un error crudo de Postgres.
    await request(server)
      .put(`/legal/documentos/${empresaId}/invalido`)
      .set('Authorization', auth(coachToken))
      .send({ estado: 'firmado' })
      .expect(400);

    // --- Consentimiento informado ---
    await request(server)
      .patch(`/coachees/${coacheeId}/consentimiento`)
      .set('Authorization', auth(coachToken))
      .send({ informado: true })
      .expect(200);

    const resumenFinal = await request(server)
      .get('/legal/resumen')
      .set('Authorization', auth(coachToken))
      .expect(200);
    const propioFinal = (resumenFinal.body as EmpresaLegalBody[]).find(
      (e) => e.empresaId === empresaId,
    )!;
    expect(propioFinal.contrato.estado).toBe('firmado');
    expect(propioFinal.contrato.vigencia).toBe('2027-01-15');
    expect(propioFinal.coacheesConConsentimiento).toBe(1);

    // --- Cumplimiento LPDP: con el único coachee de esta empresa consentido, pero
    // pueden existir otros coachees de otras suites sin consentimiento, así que solo
    // se valida que la medida refleje datos reales (no un valor fijo).
    const cumplimiento = await request(server)
      .get('/legal/cumplimiento')
      .set('Authorization', auth(coachToken))
      .expect(200);
    const medidas = cumplimiento.body as MedidaCumplimientoBody[];
    expect(medidas.find((m) => m.id === 'notas_privadas')!.activa).toBe(true);
    expect(
      medidas.find((m) => m.id === 'consentimiento_informado'),
    ).toBeDefined();

    // --- Auditoría: cerrar un ciclo queda registrado, filtrable por coachee ---
    const ciclo = await request(server)
      .post('/ciclos')
      .set('Authorization', auth(coachToken))
      .send({ coacheeId, totalSesiones: 1 })
      .expect(201);
    await request(server)
      .post(`/ciclos/${(ciclo.body as { id: string }).id}/cerrar`)
      .set('Authorization', auth(coachToken))
      .send({ resultado: 'logrado' })
      .expect(201);

    const auditoria = await request(server)
      .get(`/audit?targetId=${coacheeId}`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    const logs = auditoria.body as AuditLogBody[];
    expect(logs.some((l) => l.action === 'CICLO_CERRADO')).toBe(true);

    const auditoriaFiltrada = await request(server)
      .get('/audit?action=CICLO_CERRADO')
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect(
      (auditoriaFiltrada.body as AuditLogBody[]).every(
        (l) => l.action === 'CICLO_CERRADO',
      ),
    ).toBe(true);

    // --- Búsqueda global: encuentra la empresa y el coachee recién creados.
    // Se busca solo por el suffix numérico (substring real de ambos nombres:
    // "Legal SA {suffix}" y "Legal Coachee {suffix}"), ya que ILIKE exige
    // coincidencia contigua y "Legal {suffix}" no lo es de ninguno de los dos.
    const busqueda = await request(server)
      .get(`/busqueda?q=${suffix}`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    const resultado = busqueda.body as ResultadoBusquedaBody;
    expect(resultado.empresas.some((e) => e.id === empresaId)).toBe(true);
    expect(resultado.coachees.some((c) => c.id === coacheeId)).toBe(true);
  });
});
