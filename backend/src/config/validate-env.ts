const REQUIRED_SECRETS = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;
const MIN_SECRET_LENGTH = 32;

// Valores de ejemplo que aparecen en .env.example o en versiones antiguas del código —
// si alguien copia el .env.example tal cual, o si el fallback viejo sigue en un despliegue
// no actualizado, esto lo detecta igual (no basta con "no está vacío").
const VALORES_DE_EJEMPLO_CONOCIDOS = new Set([
  'change-me-access',
  'change-me-refresh',
  'dev-access-secret',
  'dev-refresh-secret',
]);

/**
 * Falla el arranque si los secretos de JWT no están configurados con un valor real —
 * antes, si faltaban, la app arrancaba igual firmando tokens con un secreto conocido
 * ('dev-access-secret'), lo que le permite a cualquiera que haya visto este código
 * forjar un token válido como coach. Mejor no arrancar que arrancar inseguro.
 */
export function validateEnv(
  env: Record<string, unknown>,
): Record<string, unknown> {
  const problemas: string[] = [];

  for (const key of REQUIRED_SECRETS) {
    const valor = env[key];
    if (typeof valor !== 'string' || valor.length === 0) {
      problemas.push(`${key} no está definida.`);
      continue;
    }
    if (VALORES_DE_EJEMPLO_CONOCIDOS.has(valor)) {
      problemas.push(
        `${key} usa un valor de ejemplo conocido — genera uno real.`,
      );
    } else if (valor.length < MIN_SECRET_LENGTH) {
      problemas.push(
        `${key} es demasiado corta (mínimo ${MIN_SECRET_LENGTH} caracteres).`,
      );
    }
  }

  if (problemas.length > 0) {
    throw new Error(
      [
        'Configuración insegura — la app no va a arrancar así:',
        ...problemas.map((p) => `  - ${p}`),
        '',
        'Genera un secreto real con: openssl rand -base64 48',
      ].join('\n'),
    );
  }

  return env;
}
