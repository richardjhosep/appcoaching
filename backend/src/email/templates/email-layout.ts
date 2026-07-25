const CURRENT_YEAR = new Date().getFullYear();

export const LOGO_CID = 'coachos-logo';

/**
 * Envoltorio visual compartido por todos los correos transaccionales de CoachOS:
 * header con el logo, cuerpo inyectado y footer con el aviso de no-reply.
 */
export function renderEmailLayout(bodyHtml: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1ebdd;padding:32px 16px;font-family:'Inter',Arial,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#fbf9f4;border-radius:12px;overflow:hidden;border:1px solid #e4dcc9;">
            <tr>
              <td style="background-color:#121212;padding:28px 32px;text-align:center;">
                <img src="cid:${LOGO_CID}" width="200" alt="CoachOS" style="display:block;margin:0 auto;max-width:200px;height:auto;border:0;">
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;color:#121212;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;">
                <hr style="border:none;border-top:1px solid #e4dcc9;margin:0 0 20px;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#6b6b6b;">
                  Este es un mensaje automático enviado desde una casilla no-reply — por favor no respondas a este correo.
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b6b6b;">
                  © ${CURRENT_YEAR} CoachOS · Gestiona tu práctica. Multiplica tu impacto.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export function renderButton(url: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="border-radius:8px;background-color:#b08d57;">
          <a href="${url}" style="display:inline-block;padding:12px 28px;font-family:'Poppins',Arial,sans-serif;font-size:14px;font-weight:600;color:#fbf9f4;text-decoration:none;border-radius:8px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}
