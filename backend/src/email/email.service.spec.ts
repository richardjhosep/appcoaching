import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

const sendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail })),
}));

function makeConfig(values: Record<string, unknown>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('EmailService', () => {
  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue(undefined);
  });

  it('sends the temporary password email when SMTP is configured', async () => {
    const service = new EmailService(
      makeConfig({
        'smtp.host': 'smtp.gmail.com',
        'smtp.port': 587,
        'smtp.user': 'coach@gmail.com',
        'smtp.pass': 'app-password',
        'smtp.from': 'coach@gmail.com',
      }),
    );

    await service.sendTemporaryPassword({
      to: 'nuevo@example.com',
      nombre: 'Ana',
      temporaryPassword: 'temp-123',
      loginUrl: 'http://localhost/login',
    });

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"CoachOS (no-reply)" <coach@gmail.com>',
        to: 'nuevo@example.com',
        subject: expect.stringContaining('Bienvenido') as string,
        html: expect.stringContaining('temp-123') as string,
        text: expect.stringContaining('temp-123') as string,
        attachments: [
          expect.objectContaining({ cid: 'coachos-logo', encoding: 'base64' }),
        ],
      }),
    );
    const [[call]] = sendMail.mock.calls as [[{ html: string; text: string }]];
    expect(call.html).toContain('Ana');
    expect(call.html).toContain('cid:coachos-logo');
    expect(call.html).toContain('no-reply');
    expect(call.text).toContain('Ana');
  });

  it('uses the same welcome copy for a password reset as for a new account', async () => {
    const service = new EmailService(
      makeConfig({
        'smtp.host': 'smtp.gmail.com',
        'smtp.port': 587,
        'smtp.user': 'coach@gmail.com',
        'smtp.pass': 'app-password',
        'smtp.from': 'coach@gmail.com',
      }),
    );

    await service.sendTemporaryPassword({
      to: 'nuevo@example.com',
      temporaryPassword: 'temp-123',
      loginUrl: 'http://localhost/login',
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Bienvenido') as string,
      }),
    );
    const [[call]] = sendMail.mock.calls as [[{ html: string }]];
    expect(call.html).toContain('Bienvenido');
  });

  it('sends the reagendamiento-solicitado email to the coach', async () => {
    const service = new EmailService(
      makeConfig({
        'smtp.host': 'smtp.gmail.com',
        'smtp.port': 587,
        'smtp.user': 'coach@gmail.com',
        'smtp.pass': 'app-password',
        'smtp.from': 'coach@gmail.com',
      }),
    );

    await service.sendReagendamientoSolicitado({
      to: 'coach@example.com',
      nombreCoachee: 'Ana',
      fechaHoraSesion: '2026-08-05T15:00:00.000Z',
      motivo: 'tengo un viaje',
      verUrl: 'http://localhost/coach/comercial',
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'coach@example.com',
        subject: expect.stringContaining('reagendamiento') as string,
      }),
    );
    const [[call]] = sendMail.mock.calls as [[{ html: string; text: string }]];
    expect(call.html).toContain('Ana');
    expect(call.html).toContain('tengo un viaje');
    expect(call.text).toContain('Ana');
    expect(call.text).toContain('tengo un viaje');
  });

  it('sends the reagendamiento-resuelto email to the coachee', async () => {
    const service = new EmailService(
      makeConfig({
        'smtp.host': 'smtp.gmail.com',
        'smtp.port': 587,
        'smtp.user': 'coach@gmail.com',
        'smtp.pass': 'app-password',
        'smtp.from': 'coach@gmail.com',
      }),
    );

    await service.sendReagendamientoResuelto({
      to: 'coachee@example.com',
      fechaHoraSesion: '2026-08-05T15:00:00.000Z',
      nuevaFechaHora: '2026-08-06T15:00:00.000Z',
      respuestaCoach: 'Nos vemos el jueves',
      verUrl: 'http://localhost/coachee/sesiones',
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'coachee@example.com',
        subject: expect.stringContaining('resuelto') as string,
      }),
    );
    const [[call]] = sendMail.mock.calls as [[{ html: string; text: string }]];
    expect(call.html).toContain('Nos vemos el jueves');
    expect(call.text).toContain('Nos vemos el jueves');
  });

  it('sends the plan-desarrollo reminder email to the coachee', async () => {
    const service = new EmailService(
      makeConfig({
        'smtp.host': 'smtp.gmail.com',
        'smtp.port': 587,
        'smtp.user': 'coach@gmail.com',
        'smtp.pass': 'app-password',
        'smtp.from': 'coach@gmail.com',
      }),
    );

    await service.sendRecordatorioPlan({
      to: 'coachee@example.com',
      nombreCoachee: 'Ana',
      verUrl: 'http://localhost/coachee/plan',
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'coachee@example.com',
        subject: expect.stringContaining('Recordatorio') as string,
      }),
    );
    const [[call]] = sendMail.mock.calls as [[{ html: string; text: string }]];
    expect(call.html).toContain('Ana');
    expect(call.text).toContain('Ana');
  });

  it('does nothing (and does not throw) when SMTP credentials are missing', async () => {
    const service = new EmailService(makeConfig({}));

    await expect(
      service.sendTemporaryPassword({
        to: 'nuevo@example.com',
        temporaryPassword: 'temp-123',
        loginUrl: 'http://localhost/login',
      }),
    ).resolves.toBeUndefined();

    expect(sendMail).not.toHaveBeenCalled();
  });

  it('swallows send errors instead of throwing', async () => {
    sendMail.mockRejectedValue(new Error('SMTP down'));
    const service = new EmailService(
      makeConfig({
        'smtp.host': 'smtp.gmail.com',
        'smtp.port': 587,
        'smtp.user': 'coach@gmail.com',
        'smtp.pass': 'app-password',
      }),
    );

    await expect(
      service.sendTemporaryPassword({
        to: 'nuevo@example.com',
        temporaryPassword: 'temp-123',
        loginUrl: 'http://localhost/login',
      }),
    ).resolves.toBeUndefined();
  });
});
