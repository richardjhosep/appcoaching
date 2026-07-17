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

interface RecursoBody {
  id: string;
  titulo: string;
  tipo: string;
  etiquetas: string[] | null;
}

interface AprendizajeBody {
  id: string;
  contenido: string;
}

describe('Recursos (e2e)', () => {
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

  it('runs the full upload → asignar → autoasignar → descargar → aprendizaje flow', async () => {
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
        nombre: 'Recursos Test',
        email: `recursos-${suffix}@example.com`,
      })
      .expect(201);
    const { coachee, temporaryPassword } =
      coacheeCreated.body as CreateCoacheeResponse;

    const otroCoacheeCreated = await request(server)
      .post('/coachees')
      .set('Authorization', auth(coachToken))
      .send({
        nombre: 'Recursos Otro',
        email: `recursos-otro-${suffix}@example.com`,
      })
      .expect(201);
    const otroCoachee = (otroCoacheeCreated.body as CreateCoacheeResponse)
      .coachee;

    // El catálogo de recursos es global (no aislado por test run), así que se usan
    // título/etiqueta únicos por suffix para no colisionar con datos de otras corridas.
    const tituloLink = `Artículo sobre liderazgo ${suffix}`;
    const etiquetaArchivo = `ejercicios-${suffix}`;

    // Recurso tipo link.
    const linkCreado = await request(server)
      .post('/recursos')
      .set('Authorization', auth(coachToken))
      .field('titulo', tituloLink)
      .field('tipo', 'link')
      .field('url', 'https://example.com/liderazgo')
      .field('etiquetas', 'liderazgo, comunicación')
      .expect(201);
    const linkRecurso = linkCreado.body as RecursoBody;
    expect(linkRecurso.etiquetas).toEqual(['liderazgo', 'comunicación']);

    // Recurso tipo archivo (subida real).
    const archivoCreado = await request(server)
      .post('/recursos')
      .set('Authorization', auth(coachToken))
      .field('titulo', 'Manual de ejercicios')
      .field('tipo', 'archivo')
      .field('etiquetas', etiquetaArchivo)
      .attach('archivo', Buffer.from('contenido de prueba'), 'manual.txt')
      .expect(201);
    const archivoRecurso = archivoCreado.body as RecursoBody;

    // Búsqueda y filtro por etiqueta.
    const busqueda = await request(server)
      .get(`/recursos?search=${encodeURIComponent(tituloLink)}`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect(busqueda.body as RecursoBody[]).toHaveLength(1);

    const filtroEtiqueta = await request(server)
      .get(`/recursos?etiqueta=${encodeURIComponent(etiquetaArchivo)}`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect(filtroEtiqueta.body as RecursoBody[]).toHaveLength(1);
    expect((filtroEtiqueta.body as RecursoBody[])[0].id).toBe(
      archivoRecurso.id,
    );

    // Coach asigna el recurso link al coachee.
    await request(server)
      .put(`/recursos/${linkRecurso.id}/asignaciones/${coachee.id}`)
      .set('Authorization', auth(coachToken))
      .send({ activa: true })
      .expect(200);

    const coacheeLogin = await request(server)
      .post('/auth/login')
      .send({
        email: `recursos-${suffix}@example.com`,
        password: temporaryPassword,
      })
      .expect(200);
    const coacheeToken = (coacheeLogin.body as TokenPairBody).accessToken;

    const bibliotecaInicial = await request(server)
      .get('/recursos/me')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    expect(bibliotecaInicial.body as RecursoBody[]).toHaveLength(1);
    expect((bibliotecaInicial.body as RecursoBody[])[0].id).toBe(
      linkRecurso.id,
    );

    // Coachee se autoasigna el recurso archivo desde el catálogo general.
    await request(server)
      .post(`/recursos/${archivoRecurso.id}/autoasignar`)
      .set('Authorization', auth(coacheeToken))
      .expect(201);

    const bibliotecaCompleta = await request(server)
      .get('/recursos/me')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    expect(bibliotecaCompleta.body as RecursoBody[]).toHaveLength(2);

    // Descarga del archivo: el coachee asignado puede.
    const descarga = await request(server)
      .get(`/recursos/${archivoRecurso.id}/archivo`)
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    expect(descarga.text).toBe('contenido de prueba');

    // Un coachee no asignado no puede descargar.
    const otroLogin = await request(server)
      .post('/auth/login')
      .send({
        email: `recursos-otro-${suffix}@example.com`,
        password: (otroCoacheeCreated.body as CreateCoacheeResponse)
          .temporaryPassword,
      })
      .expect(200);
    const otroToken = (otroLogin.body as TokenPairBody).accessToken;
    await request(server)
      .get(`/recursos/${archivoRecurso.id}/archivo`)
      .set('Authorization', auth(otroToken))
      .expect(403);
    expect(otroCoachee.id).not.toBe(coachee.id);

    // Aprendizaje sobre el recurso autoasignado.
    await request(server)
      .post(`/recursos/${archivoRecurso.id}/aprendizajes`)
      .set('Authorization', auth(coacheeToken))
      .send({ contenido: 'Aprendí a estructurar mejor mis rutinas' })
      .expect(201);

    const misAprendizajes = await request(server)
      .get(`/recursos/${archivoRecurso.id}/aprendizajes/me`)
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    expect(misAprendizajes.body as AprendizajeBody[]).toHaveLength(1);

    const aprendizajesDesdeCoach = await request(server)
      .get(`/recursos/${archivoRecurso.id}/aprendizajes`)
      .set('Authorization', auth(coachToken))
      .expect(200);
    expect(aprendizajesDesdeCoach.body as AprendizajeBody[]).toHaveLength(1);

    // No se puede quitar un recurso asignado por el coach desde el lado del coachee.
    await request(server)
      .delete(`/recursos/${linkRecurso.id}/autoasignar`)
      .set('Authorization', auth(coacheeToken))
      .expect(403);

    // Sí puede quitar su propia autoasignación.
    await request(server)
      .delete(`/recursos/${archivoRecurso.id}/autoasignar`)
      .set('Authorization', auth(coacheeToken))
      .expect(200);

    const bibliotecaFinal = await request(server)
      .get('/recursos/me')
      .set('Authorization', auth(coacheeToken))
      .expect(200);
    expect(bibliotecaFinal.body as RecursoBody[]).toHaveLength(1);
    expect((bibliotecaFinal.body as RecursoBody[])[0].id).toBe(linkRecurso.id);
  });
});
