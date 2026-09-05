// Enum propio, no se reusa EstadoSolicitud (reagendamiento): ahí solo existe
// pendiente/resuelta, sin distinguir aceptado de rechazado — acá sí importa la distinción,
// porque una solicitud de sesión aprobada crea una Sesion real y una rechazada no.
export enum EstadoSolicitudSesion {
  PENDIENTE = 'pendiente',
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada',
}
