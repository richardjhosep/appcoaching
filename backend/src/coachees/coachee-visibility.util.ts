import { Role } from '../auth/enums/role.enum';
import type { Coachee } from './entities/coachee.entity';

/**
 * Qué parte del registro del coachee puede ver cada rol. La visibilidad se decide acá, en el
 * servidor — no en la pantalla —, porque cualquiera con un token puede llamar a la API directo.
 *
 * - EMPRESA: solo datos laborales (nombre, cargo, área, jefe, objetivo del proceso, estado). Nunca
 *   la presentación personal (bio, foto, teléfono, correo de contacto), el interruptor de
 *   compartir, las tarifas del coach ni los campos internos de la cuenta.
 * - COACH: ve todo, salvo bio y foto cuando el coachee no activó `compartirPerfilConCoach`
 *   (opt-in, distinto del consentimiento informado del proceso).
 */
export function redactarCoacheeParaRol(coachee: Coachee, role: Role): Coachee {
  if (role === Role.EMPRESA) {
    return {
      ...coachee,
      bio: null,
      fotoPath: null,
      fotoNombre: null,
      telefono: null,
      emailContacto: null,
      tarifaPropia: null,
      compartirPerfilConCoach: false,
      user: coachee.user
        ? ({
            id: coachee.user.id,
            email: coachee.user.email,
          } as Coachee['user'])
        : coachee.user,
    };
  }
  if (role === Role.COACH && !coachee.compartirPerfilConCoach) {
    return {
      ...coachee,
      bio: null,
      fotoPath: null,
      fotoNombre: null,
    };
  }
  return coachee;
}
