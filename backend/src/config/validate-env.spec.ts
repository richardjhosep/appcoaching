import { validateEnv } from './validate-env';

const secretoReal = 'x'.repeat(48);

function env(overrides: Record<string, unknown> = {}) {
  return {
    JWT_ACCESS_SECRET: secretoReal,
    JWT_REFRESH_SECRET: secretoReal,
    ...overrides,
  };
}

describe('validateEnv', () => {
  it('returns the env unchanged when both secrets are real and long enough', () => {
    expect(validateEnv(env())).toEqual(env());
  });

  it('throws when a secret is missing entirely', () => {
    expect(() => validateEnv(env({ JWT_ACCESS_SECRET: undefined }))).toThrow(
      /JWT_ACCESS_SECRET no está definida/,
    );
  });

  it('throws when a secret is the known dev fallback that used to ship as a default', () => {
    expect(() =>
      validateEnv(env({ JWT_ACCESS_SECRET: 'dev-access-secret' })),
    ).toThrow(/valor de ejemplo conocido/);
  });

  it('throws when a secret is the .env.example placeholder copied verbatim', () => {
    expect(() =>
      validateEnv(env({ JWT_REFRESH_SECRET: 'change-me-refresh' })),
    ).toThrow(/valor de ejemplo conocido/);
  });

  it('throws when a secret is real but too short', () => {
    expect(() => validateEnv(env({ JWT_ACCESS_SECRET: 'short' }))).toThrow(
      /demasiado corta/,
    );
  });

  it('reports both problems at once when both secrets are bad', () => {
    expect(() =>
      validateEnv({ JWT_ACCESS_SECRET: '', JWT_REFRESH_SECRET: 'short' }),
    ).toThrow(
      /JWT_ACCESS_SECRET no está definida[\s\S]*JWT_REFRESH_SECRET es demasiado corta/,
    );
  });
});
