import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

const FIELD_LABELS: Record<string, string> = {
  email: 'El correo',
  password: 'La contraseña',
  refreshToken: 'El token de sesión',
  coacheeId: 'El coachee',
  totalSesiones: 'El total de sesiones',
  resumenReunionInicial: 'El resumen de la reunión inicial',
  resultado: 'El resultado',
  informeFinal: 'El informe final',
  nombre: 'El nombre',
  empresaId: 'La empresa',
  jefeDirecto: 'El jefe directo',
  objetivoProceso: 'El objetivo del proceso',
  tarifaPropia: 'La tarifa propia',
  areaGerencia: 'El área/gerencia',
  activo: 'El estado activo',
  activa: 'El estado activo',
  informado: 'El consentimiento informado',
  telefono: 'El teléfono',
  emailContacto: 'El correo de contacto',
  tarifaHora: 'La tarifa por hora',
  isActive: 'El estado activo',
  pagada: 'El estado de pago',
  horasContratadas: 'Las horas contratadas',
  estado: 'El estado',
  fecha: 'La fecha',
  vigencia: 'La vigencia',
  objetivoId: 'El objetivo',
  actividad: 'La actividad',
  fechaInicio: 'La fecha de inicio',
  fechaFin: 'La fecha de fin',
  descripcion: 'La descripción',
  orden: 'El orden',
  comentario: 'El comentario',
  competenciaId: 'La competencia',
  nivelActual: 'El nivel actual',
  nivelObjetivo: 'El nivel objetivo',
  plazo: 'El plazo',
  descripcionEstadoActual: 'La descripción del estado actual',
  objetivoGeneral: 'El objetivo general',
  habitoCuando: 'El campo "cuándo" del hábito',
  habitoEnVezDe: 'El campo "en vez de" del hábito',
  habitoVoyA: 'El campo "voy a" del hábito',
  habitoObvio: 'El campo "obvio" del hábito',
  habitoSencillo: 'El campo "sencillo" del hábito',
  habitoAtractivo: 'El campo "atractivo" del hábito',
  habitoSatisfactorio: 'El campo "satisfactorio" del hábito',
  formacionLibros: 'Los libros de formación',
  formacionArticulos: 'Los artículos de formación',
  formacionVideos: 'Los videos de formación',
  formacionPodcasts: 'Los podcasts de formación',
  formacionPracticaGuiada: 'La práctica guiada',
  contenido: 'El contenido',
  titulo: 'El título',
  etiquetas: 'Las etiquetas',
  tipo: 'El tipo',
  url: 'La URL',
  calificacion: 'La calificación',
  nombreSugerido: 'El nombre sugerido',
  mensaje: 'El mensaje',
  fechaHora: 'La fecha y hora',
  linkVideollamada: 'El link de videollamada',
  motivo: 'El motivo',
  nuevaFechaHora: 'La nueva fecha y hora',
  respuestaCoach: 'La respuesta del coach',
  aprendizaje: 'El aprendizaje',
  utilidad: 'La utilidad',
  cercaniaObjetivo: 'La cercanía al objetivo',
  recomendacion: 'La recomendación',
  temasProximaSesion: 'Los temas para la próxima sesión',
  notasPrivadas: 'Las notas privadas',
  asistio: 'La asistencia',
  currentPassword: 'La contraseña actual',
  newPassword: 'La nueva contraseña',
  role: 'El rol',
};

function humanizeLabel(property: string): string {
  const spaced = property.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return `El campo "${spaced}"`;
}

function labelFor(property: string): string {
  return FIELD_LABELS[property] ?? humanizeLabel(property);
}

function extractNumber(rawMessage: string): string {
  return rawMessage.match(/-?\d+(\.\d+)?/)?.[0] ?? '';
}

function extractEnumValues(rawMessage: string): string {
  return rawMessage.match(/following values:\s*(.+)$/)?.[1] ?? '';
}

const TRANSLATORS: Record<
  string,
  (label: string, rawMessage: string) => string
> = {
  isNotEmpty: (label) => `${label} es obligatorio.`,
  isDefined: (label) => `${label} es obligatorio.`,
  isString: (label) => `${label} debe ser texto.`,
  isInt: (label) => `${label} debe ser un número entero.`,
  isNumber: (label) => `${label} debe ser un número.`,
  min: (label, raw) =>
    `${label} debe ser mayor o igual a ${extractNumber(raw)}.`,
  max: (label, raw) =>
    `${label} debe ser menor o igual a ${extractNumber(raw)}.`,
  minLength: (label, raw) =>
    `${label} debe tener al menos ${extractNumber(raw)} caracteres.`,
  maxLength: (label, raw) =>
    `${label} debe tener como máximo ${extractNumber(raw)} caracteres.`,
  isEmail: (label) => `${label} debe ser un correo electrónico válido.`,
  isBoolean: (label) => `${label} debe ser verdadero o falso.`,
  isUuid: (label) => `${label} no es válido.`,
  isEnum: (label, raw) =>
    `${label} debe ser uno de los siguientes valores: ${extractEnumValues(raw)}.`,
  isDateString: (label) => `${label} debe ser una fecha válida.`,
  isUrl: (label) => `${label} debe ser una URL válida.`,
  matches: (label) => `${label} no tiene un formato válido.`,
  whitelistValidation: (label) => `${label} no es un campo válido.`,
};

function translateConstraint(
  key: string,
  label: string,
  rawMessage: string,
): string {
  const translator = TRANSLATORS[key];
  if (translator) return translator(label, rawMessage);
  return `${label} no es válido.`;
}

export function spanishValidationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const fieldErrors: Record<string, string> = {};
  const messages: string[] = [];

  for (const error of errors) {
    const label = labelFor(error.property);
    const constraints = error.constraints ?? {};
    const [constraintKey, rawMessage] = Object.entries(constraints)[0] ?? [
      '',
      '',
    ];
    const message = translateConstraint(constraintKey, label, rawMessage);
    fieldErrors[error.property] = message;
    messages.push(message);
  }

  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: messages,
    fieldErrors,
  });
}
