import { Role } from '../auth/enums/role.enum';
import type { Coachee } from './entities/coachee.entity';
import { redactarCoacheeParaRol } from './coachee-visibility.util';

const coachee = (over: Partial<Coachee> = {}): Coachee =>
  ({
    id: 'c1',
    nombre: 'Camila',
    cargo: 'Jefa de Mantención',
    areaGerencia: 'Operaciones',
    jefeDirecto: 'Pedro',
    objetivoProceso: 'Liderar equipos',
    bio: 'Mi historia personal',
    telefono: '+56 9 1111 1111',
    emailContacto: 'camila@gmail.com',
    fotoPath: 'foto-coachee-1.jpg',
    fotoNombre: 'yo.jpg',
    tarifaPropia: 100,
    compartirPerfilConCoach: false,
    consentimientoInformado: true,
    consentimientoSensibles: true,
    consentimientoSensiblesFecha: new Date(),
    consentimientoSensiblesVersion: '2026-10',
    user: {
      id: 'u1',
      email: 'camila@empresa.cl',
      mustChangePassword: true,
      tempPasswordExpiresAt: new Date(),
    },
    ...over,
  }) as unknown as Coachee;

describe('redactarCoacheeParaRol', () => {
  it('EMPRESA no recibe la presentación personal, contacto, tarifas ni campos de cuenta', () => {
    const r = redactarCoacheeParaRol(
      coachee({ compartirPerfilConCoach: true }),
      Role.EMPRESA,
    );
    expect(r.bio).toBeNull();
    expect(r.fotoPath).toBeNull();
    expect(r.telefono).toBeNull();
    expect(r.emailContacto).toBeNull();
    expect(r.tarifaPropia).toBeNull();
    expect(r.compartirPerfilConCoach).toBe(false);
    expect(r.consentimientoSensibles).toBe(false);
    expect(r.consentimientoSensiblesFecha).toBeNull();
    expect(r.user).toEqual({ id: 'u1', email: 'camila@empresa.cl' });
  });

  it('EMPRESA conserva los datos laborales', () => {
    const r = redactarCoacheeParaRol(coachee(), Role.EMPRESA);
    expect(r).toMatchObject({
      nombre: 'Camila',
      cargo: 'Jefa de Mantención',
      areaGerencia: 'Operaciones',
      objetivoProceso: 'Liderar equipos',
      consentimientoInformado: true,
    });
  });

  it('COACH no ve bio ni foto si el coachee no activó compartirPerfilConCoach', () => {
    const r = redactarCoacheeParaRol(
      coachee({ compartirPerfilConCoach: false }),
      Role.COACH,
    );
    expect(r.bio).toBeNull();
    expect(r.fotoPath).toBeNull();
    expect(r.telefono).toBe('+56 9 1111 1111');
  });

  it('COACH ve bio y foto cuando el coachee las comparte', () => {
    const r = redactarCoacheeParaRol(
      coachee({ compartirPerfilConCoach: true }),
      Role.COACH,
    );
    expect(r.bio).toBe('Mi historia personal');
    expect(r.fotoPath).toBe('foto-coachee-1.jpg');
  });

  it('no muta el objeto original', () => {
    const original = coachee();
    redactarCoacheeParaRol(original, Role.EMPRESA);
    expect(original.bio).toBe('Mi historia personal');
  });
});
