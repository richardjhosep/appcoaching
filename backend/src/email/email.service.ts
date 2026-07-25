import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { COACHOS_LOGO_BASE64 } from './assets/logo-base64';
import {
  LOGO_CID,
  renderButton,
  renderEmailLayout,
} from './templates/email-layout';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function renderInfoBox(label: string, content: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1ebdd;border:1px solid #e4dcc9;border-radius:8px;margin:0 0 8px;">
      <tr>
        <td style="padding:16px 20px;font-size:14px;line-height:1.6;">
          <span style="color:#6b6b6b;">${label}</span><br>
          ${content}
        </td>
      </tr>
    </table>
  `;
}

function renderFallbackLink(url: string): string {
  return `
    <p style="margin:0;font-size:13px;line-height:1.6;color:#6b6b6b;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
      <a href="${url}" style="color:#b08d57;">${url}</a>
    </p>
  `;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string | undefined;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('smtp.user');
    const pass = this.config.get<string>('smtp.pass');
    const from = this.config.get<string>('smtp.from');
    this.from = from ? `"CoachOS (no-reply)" <${from}>` : undefined;

    if (!user || !pass) {
      this.logger.warn(
        'SMTP_USER/SMTP_PASS no configurados — los correos no se enviarán (solo quedan disponibles en pantalla).',
      );
      this.transporter = null;
      return;
    }

    const port = this.config.get<number>('smtp.port') ?? 587;
    this.transporter = createTransport({
      host: this.config.get<string>('smtp.host'),
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async sendTemporaryPassword(options: {
    to: string;
    nombre?: string | null;
    temporaryPassword: string;
    loginUrl: string;
    isNewAccount?: boolean;
  }): Promise<void> {
    const isNewAccount = options.isNewAccount ?? true;
    const nombre = options.nombre ? escapeHtml(options.nombre) : null;
    const saludo = isNewAccount
      ? nombre
        ? `¡Bienvenido/a a CoachOS, ${nombre}!`
        : '¡Bienvenido/a a CoachOS!'
      : nombre
        ? `Hola, ${nombre}`
        : 'Hola';
    const intro = isNewAccount
      ? 'Gracias por confiar en nosotros para acompañar tu proceso de coaching. Ya creamos tu cuenta y está lista para que ingreses.'
      : 'Generamos una nueva contraseña temporal para tu cuenta en CoachOS. Usa estos datos para ingresar:';
    const subject = isNewAccount
      ? 'Bienvenido/a a CoachOS — tu cuenta ya está lista'
      : 'Tu contraseña de CoachOS fue restablecida';

    const body = `
      <h1 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;font-size:22px;color:#121212;">${saludo}</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        ${intro}
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1ebdd;border:1px solid #e4dcc9;border-radius:8px;margin:0 0 8px;">
        <tr>
          <td style="padding:16px 20px;font-size:14px;line-height:1.9;">
            <span style="color:#6b6b6b;">Usuario</span><br>
            <strong>${escapeHtml(options.to)}</strong><br><br>
            <span style="color:#6b6b6b;">Contraseña temporal</span><br>
            <strong style="font-family:'IBM Plex Mono',monospace;letter-spacing:0.5px;">${escapeHtml(options.temporaryPassword)}</strong>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#6b6b6b;">
        Por tu seguridad, esta contraseña es válida por 48 horas y deberás cambiarla la primera vez que inicies sesión.
      </p>
      ${renderButton(options.loginUrl, 'Ingresar a CoachOS')}
      ${renderFallbackLink(options.loginUrl)}
    `;

    const text = [
      saludo,
      '',
      intro,
      '',
      `Usuario: ${options.to}`,
      `Contraseña temporal: ${options.temporaryPassword}`,
      '',
      'Esta contraseña es válida por 48 horas y deberás cambiarla la primera vez que inicies sesión.',
      '',
      `Ingresa aquí: ${options.loginUrl}`,
      '',
      'Este es un mensaje automático enviado desde una casilla no-reply — por favor no respondas a este correo.',
    ].join('\n');

    await this.send({
      to: options.to,
      subject,
      html: renderEmailLayout(body),
      text,
    });
  }

  async sendReagendamientoSolicitado(options: {
    to: string;
    nombreCoachee: string;
    fechaHoraSesion: string;
    motivo?: string | null;
    verUrl: string;
  }): Promise<void> {
    const subject = 'Nueva solicitud de reagendamiento';
    const nombreCoachee = escapeHtml(options.nombreCoachee);
    const fecha = formatFechaHora(options.fechaHoraSesion);
    const intro = `${nombreCoachee} solicitó reagendar su sesión del ${fecha}.`;
    const motivoBox = options.motivo
      ? renderInfoBox('Motivo', escapeHtml(options.motivo))
      : '';

    const body = `
      <h1 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;font-size:22px;color:#121212;">Nueva solicitud de reagendamiento</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${intro}</p>
      ${motivoBox}
      ${renderButton(options.verUrl, 'Ver en CoachOS')}
      ${renderFallbackLink(options.verUrl)}
    `;

    const text = [
      'Nueva solicitud de reagendamiento',
      '',
      `${options.nombreCoachee} solicitó reagendar su sesión del ${fecha}.`,
      ...(options.motivo ? ['', `Motivo: ${options.motivo}`] : []),
      '',
      `Ver en CoachOS: ${options.verUrl}`,
      '',
      'Este es un mensaje automático enviado desde una casilla no-reply — por favor no respondas a este correo.',
    ].join('\n');

    await this.send({
      to: options.to,
      subject,
      html: renderEmailLayout(body),
      text,
    });
  }

  async sendReagendamientoResuelto(options: {
    to: string;
    fechaHoraSesion: string;
    nuevaFechaHora?: string | null;
    respuestaCoach?: string | null;
    verUrl: string;
  }): Promise<void> {
    const subject = 'Tu reagendamiento fue resuelto';
    const fechaOriginal = formatFechaHora(options.fechaHoraSesion);
    const nuevaFecha = options.nuevaFechaHora
      ? formatFechaHora(options.nuevaFechaHora)
      : null;
    const intro = nuevaFecha
      ? `Tu coach respondió tu solicitud de reagendamiento. La sesión del ${fechaOriginal} ahora quedó agendada para el ${nuevaFecha}.`
      : `Tu coach respondió tu solicitud de reagendamiento sobre la sesión del ${fechaOriginal}.`;
    const respuestaBox = options.respuestaCoach
      ? renderInfoBox('Mensaje de tu coach', escapeHtml(options.respuestaCoach))
      : '';

    const body = `
      <h1 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;font-size:22px;color:#121212;">Tu reagendamiento fue resuelto</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${intro}</p>
      ${respuestaBox}
      ${renderButton(options.verUrl, 'Ver mis sesiones')}
      ${renderFallbackLink(options.verUrl)}
    `;

    const text = [
      'Tu reagendamiento fue resuelto',
      '',
      intro,
      ...(options.respuestaCoach
        ? ['', `Mensaje de tu coach: ${options.respuestaCoach}`]
        : []),
      '',
      `Ver mis sesiones: ${options.verUrl}`,
      '',
      'Este es un mensaje automático enviado desde una casilla no-reply — por favor no respondas a este correo.',
    ].join('\n');

    await this.send({
      to: options.to,
      subject,
      html: renderEmailLayout(body),
      text,
    });
  }

  private async send(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: [
          {
            filename: 'coachos-logo.jpg',
            content: COACHOS_LOGO_BASE64,
            encoding: 'base64',
            cid: LOGO_CID,
          },
        ],
      });
      this.logger.log(`Correo enviado a ${options.to}`);
    } catch (err) {
      this.logger.error(
        `No se pudo enviar el correo a ${options.to}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
